import { ForbiddenError, LOGO_MAX_BYTES, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { logoKey, uploadOrganizationLogo } from "./upload-organization-logo";

let state: InMemoryIdentityState;
const run = () => uploadOrganizationLogo(createInMemoryIdentityDependencies(state));
const admin = organizationActorWith("admin");
const logo = (contentType = "image/png", bytes = 1024) => ({
  body: new ArrayBuffer(bytes),
  contentType,
});

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
});

describe("uploadOrganizationLogo", () => {
  it.each<OrganizationRole>(["owner", "admin"])("lets an %s upload the logo", async (role) => {
    expect(await run()(organizationActorWith(role), logo())).toEqual({
      isOk: true,
      value: undefined,
    });
  });

  it("stores the logo under the organization and logs it", async () => {
    await run()(admin, logo("image/svg+xml"));
    expect(logoKey("organization-a")).toBe("organizations/organization-a/logo");
    expect(state.logos.get("organizations/organization-a/logo")).toBe("image/svg+xml");
    expect(state.organizations[0]?.logoKey).toBe("organizations/organization-a/logo");
    expect(state.auditEntries).toEqual([
      {
        organizationId: "organization-a",
        actorUserId: "user-admin",
        action: "organization.logo_updated",
        targetType: "organization",
        targetId: "organization-a",
      },
    ]);
  });

  it.each(["image/png", "image/jpeg", "image/webp", "image/svg+xml"])(
    "accepts a %s logo",
    async (contentType) => {
      expect((await run()(admin, logo(contentType))).isOk).toBe(true);
    },
  );

  it("accepts a logo of exactly 2 MB", async () => {
    expect(LOGO_MAX_BYTES).toBe(2 * 1024 * 1024);
    expect((await run()(admin, logo("image/png", LOGO_MAX_BYTES))).isOk).toBe(true);
  });

  it.each<readonly [string, string, number]>([
    ["a file over 2 MB", "image/png", LOGO_MAX_BYTES + 1],
    ["an empty file", "image/png", 0],
    ["a PDF", "application/pdf", 1024],
    ["a GIF", "image/gif", 1024],
  ])("refuses %s and stores nothing", async (_, contentType, bytes) => {
    expect(await run()(admin, logo(contentType, bytes))).toEqual({
      isOk: false,
      error: "invalid_logo",
    });
    expect(state.logos.size).toBe(0);
    expect(state.organizations[0]?.logoKey).toBeNull();
  });

  it.each<OrganizationRole>(["secretary", "technician"])("refuses a %s", async (role) => {
    await expect(run()(organizationActorWith(role), logo())).rejects.toThrow(ForbiddenError);
    expect(state.logos.size).toBe(0);
  });

  it("refuses an owner seen through an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), logo()),
    ).rejects.toThrow(ForbiddenError);
  });
});
