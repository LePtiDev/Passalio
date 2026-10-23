import type { ComplianceMutation } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemoryComplianceState } from "../infrastructure/in-memory-compliance-dependencies";
import { applyComplianceMutation } from "./apply-compliance-mutation";
import { validCertificateData } from "./certificate-data.fixture";
import {
  actorOf,
  complianceDependenciesOf,
  documentIdOf,
  ORGANIZATION_B,
  reserveFor,
  seededComplianceState,
  signInput,
} from "./compliance.fixture";

let state: InMemoryComplianceState;
let dependencies: ReturnType<typeof complianceDependenciesOf>;

const technician = actorOf("technician");
const signing: ComplianceMutation = { type: "sign_document", ...signInput() };
const apply = applyComplianceMutation;

beforeEach(async () => {
  state = seededComplianceState();
  dependencies = complianceDependenciesOf(state);
  await reserveFor(dependencies, technician);
});

describe("applyComplianceMutation", () => {
  it("signs the document described by the mutation", async () => {
    expect(await apply(dependencies)(technician, signing)).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(state.documents).toHaveLength(1);
  });

  it("treats a replayed signature as applied without a second document", async () => {
    await apply(dependencies)(technician, signing);
    expect(await apply(dependencies)(technician, signing)).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(state.documents).toHaveLength(1);
    expect(state.equipmentUpdates).toHaveLength(1);
  });

  it("never overwrites a signed document replayed with different data", async () => {
    await apply(dependencies)(technician, signing);
    const original = state.documents[0];
    const altered: ComplianceMutation = {
      ...signing,
      number: 2,
      data: validCertificateData({ anomalies: "Conduit fissuré", isDoNotUse: true }),
    };
    expect(await apply(dependencies)(technician, altered)).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(state.documents).toHaveLength(1);
    expect(state.documents[0]).toEqual(original);
    expect(state.documents[0]).toMatchObject({ number: 1, data: { anomalies: null } });
  });

  it("refuses a document id already used by another organization", async () => {
    await apply(dependencies)(technician, signing);
    const foreignTechnician = actorOf("technician", { organizationId: ORGANIZATION_B });
    await reserveFor(dependencies, foreignTechnician);
    expect(await apply(dependencies)(foreignTechnician, signing)).toEqual({
      isOk: false,
      error: "already_exists",
    });
    expect(state.documents).toHaveLength(1);
  });

  it("passes on the business refusal of the signature", async () => {
    expect(
      await apply(dependencies)(technician, {
        ...signing,
        documentId: documentIdOf(2),
        number: 21,
      }),
    ).toEqual({ isOk: false, error: "number_not_reserved" });
  });

  it("turns the secretary's signature into a rejection instead of an exception", async () => {
    expect(await apply(dependencies)(actorOf("secretary"), signing)).toEqual({
      isOk: false,
      error: "forbidden",
    });
    expect(state.documents).toHaveLength(0);
  });

  it("refuses the signature during an impersonation", async () => {
    expect(
      await apply(dependencies)(actorOf("technician", { isImpersonating: true }), signing),
    ).toEqual({ isOk: false, error: "forbidden" });
    expect(state.documents).toHaveLength(0);
  });
});
