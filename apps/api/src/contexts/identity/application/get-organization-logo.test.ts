import { ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  inMemoryOrganization,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { getOrganizationLogo } from "./get-organization-logo";

const LOGO_KEY = "organizations/organization-a/logo";

let state: InMemoryIdentityState;
const run = () => getOrganizationLogo(createInMemoryIdentityDependencies(state));

beforeEach(() => {
  state = createInMemoryIdentityState();
  state.organizations.push(
    inMemoryOrganization({ id: "organization-a", name: "A", slug: "a", logoKey: LOGO_KEY }),
    inMemoryOrganization({ id: "organization-b", name: "B", slug: "b" }),
  );
  state.logos.set(LOGO_KEY, "image/png");
});

describe("getOrganizationLogo", () => {
  it.each(ORGANIZATION_ROLES)("serves the logo to a %s", async (role) => {
    const result = await run()(organizationActorWith(role));
    expect(result.isOk && result.value.contentType).toBe("image/png");
  });

  it("serves the logo during an impersonation", async () => {
    const result = await run()(organizationActorWith("owner", { isImpersonating: true }));
    expect(result.isOk).toBe(true);
  });

  it("answers not found for an organization without logo", async () => {
    expect(
      await run()(organizationActorWith("owner", { organizationId: "organization-b" })),
    ).toEqual({ isOk: false, error: "logo_not_found" });
  });

  it("answers not found when the file is missing from storage", async () => {
    state.logos.clear();
    expect(await run()(organizationActorWith("owner"))).toEqual({
      isOk: false,
      error: "logo_not_found",
    });
  });

  it("answers not found for an unknown organization", async () => {
    expect(
      await run()(organizationActorWith("owner", { organizationId: "organization-gone" })),
    ).toEqual({ isOk: false, error: "logo_not_found" });
  });
});
