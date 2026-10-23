import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { seedOrganizationOf } from "../infrastructure/in-memory-identity-fixtures";
import { completeOnboarding } from "./complete-onboarding";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryIdentityState;
const run = () => completeOnboarding(createInMemoryIdentityDependencies(state, () => NOW));

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
});

describe("completeOnboarding", () => {
  it.each<OrganizationRole>(["owner", "admin"])(
    "lets an %s finish the setup of the organization and logs it",
    async (role) => {
      expect(await run()(organizationActorWith(role))).toEqual({ isOk: true, value: undefined });
      expect(state.organizations[0]?.onboardingCompletedAt).toEqual(NOW);
      expect(state.organizations[1]?.onboardingCompletedAt).toBeNull();
      expect(state.auditEntries).toEqual([
        {
          organizationId: "organization-a",
          actorUserId: `user-${role}`,
          action: "organization.onboarding_completed",
          targetType: "organization",
          targetId: "organization-a",
        },
      ]);
    },
  );

  it.each<OrganizationRole>(["secretary", "technician"])("refuses a %s", async (role) => {
    await expect(run()(organizationActorWith(role))).rejects.toThrow(ForbiddenError);
    expect(state.organizations[0]?.onboardingCompletedAt).toBeNull();
  });

  it("refuses an owner seen through an impersonation", async () => {
    await expect(run()(organizationActorWith("owner", { isImpersonating: true }))).rejects.toThrow(
      ForbiddenError,
    );
    expect(state.auditEntries).toEqual([]);
  });
});
