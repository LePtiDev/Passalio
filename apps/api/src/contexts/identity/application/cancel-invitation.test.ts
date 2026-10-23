import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import {
  inMemoryInvitation,
  seedOrganizationOf,
} from "../infrastructure/in-memory-identity-fixtures";
import { cancelInvitation } from "./cancel-invitation";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemoryIdentityState;
const run = () => cancelInvitation(createInMemoryIdentityDependencies(state, () => NOW));
const admin = organizationActorWith("admin");
const statusOf = (id: string) =>
  state.invitations.find((invitation) => invitation.id === id)?.status;

beforeEach(() => {
  state = createInMemoryIdentityState();
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
  state.invitations.push(
    inMemoryInvitation({ id: "invitation-1", organizationId: "organization-a", role: "secretary" }),
    inMemoryInvitation({
      id: "invitation-accepted",
      organizationId: "organization-a",
      status: "accepted",
    }),
    inMemoryInvitation({ id: "invitation-b", organizationId: "organization-b" }),
  );
});

describe("cancelInvitation", () => {
  it.each<OrganizationRole>(["owner", "admin"])("lets an %s cancel an invitation", async (role) => {
    expect(await run()(organizationActorWith(role), { invitationId: "invitation-1" })).toEqual({
      isOk: true,
      value: undefined,
    });
    expect(statusOf("invitation-1")).toBe("canceled");
  });

  it("logs the cancellation with the invited role", async () => {
    await run()(admin, { invitationId: "invitation-1" });
    expect(state.auditEntries).toEqual([
      {
        organizationId: "organization-a",
        actorUserId: "user-admin",
        action: "invitation.canceled",
        targetType: "invitation",
        targetId: "invitation-1",
        data: { role: "secretary" },
      },
    ]);
  });

  it.each<OrganizationRole>(["secretary", "technician"])("refuses a %s", async (role) => {
    await expect(
      run()(organizationActorWith(role), { invitationId: "invitation-1" }),
    ).rejects.toThrow(ForbiddenError);
    expect(statusOf("invitation-1")).toBe("pending");
  });

  it("refuses an owner seen through an impersonation", async () => {
    await expect(
      run()(organizationActorWith("owner", { isImpersonating: true }), {
        invitationId: "invitation-1",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("answers not found for an accepted invitation and leaves it accepted", async () => {
    expect(await run()(admin, { invitationId: "invitation-accepted" })).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
    expect(statusOf("invitation-accepted")).toBe("accepted");
    expect(state.auditEntries).toEqual([]);
  });

  it("does not cancel an invitation of another organization", async () => {
    expect(await run()(admin, { invitationId: "invitation-b" })).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
    expect(statusOf("invitation-b")).toBe("pending");
  });

  it("cannot cancel the same invitation twice", async () => {
    await run()(admin, { invitationId: "invitation-1" });
    expect(await run()(admin, { invitationId: "invitation-1" })).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
  });
});
