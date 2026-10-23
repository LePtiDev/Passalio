import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { updateOrganizationProfile } from "./update-organization-profile";

let state: InMemoryIdentityState;
const run = () => updateOrganizationProfile(createInMemoryIdentityDependencies(state));
const admin = organizationActorWith("admin");

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
});

describe("updateOrganizationProfile", () => {
  it.each<OrganizationRole>(["owner", "admin"])("lets an %s update the profile", async (role) => {
    expect(await run()(organizationActorWith(role), { phone: "0102030405" })).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(state.organizations[0]?.phone).toBe("0102030405");
  });

  it("saves the normalized changes of this organization only and logs the changed fields", async () => {
    await run()(admin, {
      name: " Ramonage  Martin ",
      siret: "123 456 789 00011",
      trades: ["chimney_sweeping", "chimney_sweeping"],
      documentNumberPrefix: "RM-",
      nextDocumentNumber: 12,
    });
    expect(state.organizations[0]).toMatchObject({
      name: "Ramonage Martin",
      siret: "12345678900011",
      trades: ["chimney_sweeping"],
      documentNumberPrefix: "RM-",
      nextDocumentNumber: 12,
    });
    expect(state.organizations[1]?.name).toBe("Ramonage organization-b");
    expect(state.auditEntries).toEqual([
      {
        organizationId: "organization-a",
        actorUserId: "user-admin",
        action: "organization.updated",
        targetType: "organization",
        targetId: "organization-a",
        data: { fields: "name,siret,trades,documentNumberPrefix,nextDocumentNumber" },
      },
    ]);
  });

  it("clears a field sent blank", async () => {
    await run()(admin, { address: "1 rue du Four" });
    await run()(admin, { address: "   " });
    expect(state.organizations[0]?.address).toBeNull();
  });

  it.each<OrganizationRole>(["secretary", "technician"])("refuses a %s", async (role) => {
    await expect(run()(organizationActorWith(role), { phone: "0102030405" })).rejects.toThrow(
      ForbiddenError,
    );
    expect(state.organizations[0]?.phone).toBeNull();
  });

  it("refuses an owner seen through an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), { phone: "0102030405" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it.each<readonly [string, Parameters<ReturnType<typeof run>>[1], string]>([
    ["a too short name", { name: "A" }, "invalid_organization_name"],
    ["a SIRET without 14 digits", { siret: "1234" }, "invalid_siret"],
    ["a first document number of 0", { nextDocumentNumber: 0 }, "invalid_document_numbering"],
    ["a decimal document number", { nextDocumentNumber: 1.5 }, "invalid_document_numbering"],
  ])("refuses %s and saves nothing", async (_, changes, error) => {
    expect(await run()(admin, changes)).toEqual({ isOk: false, error });
    expect(state.auditEntries).toEqual([]);
    expect(state.organizations[0]?.name).toBe("Ramonage organization-a");
  });
});
