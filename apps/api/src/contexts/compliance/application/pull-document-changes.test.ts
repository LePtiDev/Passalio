import {
  DOCUMENT_NUMBER_BLOCK_SIZE,
  SYNC_PAGE_SIZE,
  type Actor,
  type OrganizationRole,
} from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemoryComplianceState } from "../infrastructure/in-memory-compliance-dependencies";
import {
  actorOf,
  complianceDependenciesOf,
  documentIdOf,
  FOREIGN_EQUIPMENT_ID,
  FOREIGN_INTERVENTION_ID,
  ORGANIZATION_A,
  ORGANIZATION_B,
  reserveFor,
  seededComplianceState,
  signInput,
} from "./compliance.fixture";
import { pullDocumentChanges } from "./pull-document-changes";
import { signDocument } from "./sign-document";

let state: InMemoryComplianceState;
let dependencies: ReturnType<typeof complianceDependenciesOf>;

const technician = actorOf("technician");
const admin = actorOf("admin");
const foreignOwner = actorOf("owner", { organizationId: ORGANIZATION_B });

const signAs = async (actor: Actor, index: number) => {
  const block = await reserveFor(dependencies, actor);
  const signed = await signDocument(dependencies)(
    actor,
    signInput({ documentId: documentIdOf(index), number: block.firstNumber }),
  );
  expect(signed.isOk).toBe(true);
};

const pulledIds = async (actor: Actor) =>
  (await pullDocumentChanges(dependencies)(actor, undefined)).rows.map(({ id }) => id);

beforeEach(() => {
  state = seededComplianceState();
  dependencies = complianceDependenciesOf(state);
});

const signInBothOrganizations = async () => {
  await signAs(technician, 1);
  await signAs(admin, 2);
  const block = await reserveFor(dependencies, foreignOwner);
  const signed = await signDocument(dependencies)(
    foreignOwner,
    signInput({
      documentId: documentIdOf(3),
      interventionId: FOREIGN_INTERVENTION_ID,
      equipmentId: FOREIGN_EQUIPMENT_ID,
      number: block.firstNumber,
    }),
  );
  expect(signed.isOk).toBe(true);
};

describe("pullDocumentChanges", () => {
  it.each<OrganizationRole>(["owner", "admin", "secretary"])(
    "lets the %s read every document of the organization",
    async (role) => {
      await signInBothOrganizations();
      expect(await pulledIds(actorOf(role))).toEqual([documentIdOf(1), documentIdOf(2)]);
    },
  );

  it("lets a technician read only the documents he signed", async () => {
    await signInBothOrganizations();
    expect(await pulledIds(technician)).toEqual([documentIdOf(1)]);
    expect(await pulledIds(actorOf("technician", { userId: "user-other-technician" }))).toEqual([]);
  });

  it("never returns the documents of another organization", async () => {
    await signInBothOrganizations();
    expect(await pulledIds(foreignOwner)).toEqual([documentIdOf(3)]);
    expect(await pulledIds(actorOf("technician", { organizationId: ORGANIZATION_B }))).toEqual([]);
    const pulled = await pullDocumentChanges(dependencies)(actorOf("owner"), undefined);
    expect(pulled.rows.every(({ organizationId }) => organizationId === ORGANIZATION_A)).toBe(true);
  });

  it("pages through the documents with a cursor and tells when more remain", async () => {
    const blockCount = Math.ceil((SYNC_PAGE_SIZE + 1) / DOCUMENT_NUMBER_BLOCK_SIZE);
    await Promise.all(
      Array.from({ length: blockCount }, () => reserveFor(dependencies, technician)),
    );
    const signed = await Promise.all(
      Array.from({ length: SYNC_PAGE_SIZE + 1 }, (_, index) =>
        signDocument(dependencies)(
          technician,
          signInput({ documentId: documentIdOf(index + 1), number: index + 1 }),
        ),
      ),
    );
    expect(signed.every(({ isOk }) => isOk)).toBe(true);
    const first = await pullDocumentChanges(dependencies)(technician, undefined);
    expect(first.rows).toHaveLength(SYNC_PAGE_SIZE);
    expect(first.hasMore).toBe(true);
    const second = await pullDocumentChanges(dependencies)(technician, first.cursor);
    expect(second.rows.map(({ id }) => id)).toEqual([documentIdOf(SYNC_PAGE_SIZE + 1)]);
    expect(second.hasMore).toBe(false);
  });
});
