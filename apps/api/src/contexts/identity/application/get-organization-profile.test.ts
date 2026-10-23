import { ORGANIZATION_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { getOrganizationProfile } from "./get-organization-profile";

let state: InMemoryIdentityState;
const run = () => getOrganizationProfile(createInMemoryIdentityDependencies(state));

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
});

describe("getOrganizationProfile", () => {
  it.each(ORGANIZATION_ROLES)("lets a %s read the profile of the organization", async (role) => {
    expect(await run()(organizationActorWith(role))).toEqual({
      isOk: true,
      value: state.organizations[0],
    });
  });

  it("stays readable during an impersonation", async () => {
    const result = await run()(organizationActorWith("owner", { isImpersonating: true }));
    expect(result.isOk && result.value.id).toBe("organization-a");
  });

  it("only reads the organization of the actor", async () => {
    const result = await run()(
      organizationActorWith("owner", { organizationId: "organization-b" }),
    );
    expect(result.isOk && result.value.id).toBe("organization-b");
  });

  it("answers not found when the organization no longer exists", async () => {
    expect(
      await run()(organizationActorWith("owner", { organizationId: "organization-gone" })),
    ).toEqual({ isOk: false, error: "organization_not_found" });
  });
});
