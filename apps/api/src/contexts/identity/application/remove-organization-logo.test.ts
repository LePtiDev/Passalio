import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { removeOrganizationLogo } from "./remove-organization-logo";
import { logoKey, uploadOrganizationLogo } from "./upload-organization-logo";

let state: InMemoryIdentityState;
const dependencies = () => createInMemoryIdentityDependencies(state);
const run = () => removeOrganizationLogo(dependencies());
const admin = organizationActorWith("admin");

const uploadLogo = () =>
  uploadOrganizationLogo(dependencies())(admin, {
    body: new ArrayBuffer(16),
    contentType: "image/png",
  });

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
});

describe("removeOrganizationLogo", () => {
  it.each<OrganizationRole>(["owner", "admin"])("lets an %s remove the logo", async (role) => {
    await uploadLogo();
    expect(await run()(organizationActorWith(role))).toEqual({ isOk: true, value: undefined });
  });

  it("deletes the stored file, clears the logo and logs it", async () => {
    await uploadLogo();
    state.auditEntries.splice(0);
    await run()(admin);
    expect(state.logos.has(logoKey("organization-a"))).toBe(false);
    expect(state.organizations[0]?.logoKey).toBeNull();
    expect(state.auditEntries).toEqual([
      {
        organizationId: "organization-a",
        actorUserId: "user-admin",
        action: "organization.logo_removed",
        targetType: "organization",
        targetId: "organization-a",
      },
    ]);
  });

  it("answers logo_not_found when there is no logo", async () => {
    expect(await run()(admin)).toEqual({ isOk: false, error: "logo_not_found" });
    expect(state.auditEntries).toEqual([]);
  });

  it.each<OrganizationRole>(["secretary", "technician"])(
    "forbids a %s to remove the logo",
    async (role) => {
      await uploadLogo();
      await expect(run()(organizationActorWith(role))).rejects.toThrow(ForbiddenError);
      expect(state.organizations[0]?.logoKey).toBe(logoKey("organization-a"));
    },
  );

  it("refuses to remove the logo during an impersonation", async () => {
    await uploadLogo();
    await expect(run()(organizationActorWith("owner", { isImpersonating: true }))).rejects.toThrow(
      ForbiddenError,
    );
    expect(state.organizations[0]?.logoKey).toBe(logoKey("organization-a"));
  });
});
