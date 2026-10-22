import { ForbiddenError, type Actor, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Invitation } from "../domain/identity-models";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  inMemoryOrganization,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { cancelInvitation } from "./cancel-invitation";
import { listPendingInvitations } from "./list-pending-invitations";
import { resendInvitation } from "./resend-invitation";

const ORGANIZATION_ID = "organization-a";
const OTHER_ORGANIZATION_ID = "organization-b";
const NOW = new Date("2026-10-22T10:00:00Z");
const NEXT_WEEK = new Date("2026-10-29T10:00:00Z");

let state: InMemoryIdentityState;
const dependencies = () => createInMemoryIdentityDependencies(state, () => NOW);

const actor = (role: OrganizationRole, isImpersonating = false): Actor => ({
  userId: `user-${role}`,
  organizationId: ORGANIZATION_ID,
  role,
  isImpersonating,
});

const addInvitation = (overrides: Partial<Invitation> & Pick<Invitation, "id">) => {
  state.invitations.push({
    organizationId: ORGANIZATION_ID,
    email: `${overrides.id}@example.fr`,
    role: "technician",
    status: "pending",
    inviterId: "user-owner",
    expiresAt: new Date("2026-10-20T10:00:00Z"),
    ...overrides,
  });
};

beforeEach(() => {
  state = createInMemoryIdentityState();
  state.organizations.push(
    inMemoryOrganization({ id: ORGANIZATION_ID, name: "Ramonage A", slug: "ramonage-a" }),
    inMemoryOrganization({ id: OTHER_ORGANIZATION_ID, name: "Ramonage B", slug: "ramonage-b" }),
  );
  addInvitation({ id: "invitation-1" });
  addInvitation({ id: "invitation-2", status: "accepted" });
  addInvitation({ id: "invitation-3", status: "canceled" });
  addInvitation({ id: "invitation-4", organizationId: OTHER_ORGANIZATION_ID });
});

describe("listPendingInvitations", () => {
  it("lists only pending invitations of the actor's organization, even during impersonation", async () => {
    const page = await listPendingInvitations(dependencies())(actor("admin", true), {});
    expect(page.invitations.map(({ id }) => id)).toEqual(["invitation-1"]);
    expect(page.nextCursor).toBeNull();
  });
});

describe("resendInvitation", () => {
  it("renews the expiry, emails again and logs it", async () => {
    const result = await resendInvitation(dependencies())(actor("admin"), {
      invitationId: "invitation-1",
    });
    expect(result).toEqual({ isOk: true, value: NEXT_WEEK });
    expect(state.invitations[0]?.expiresAt).toEqual(NEXT_WEEK);
    expect(state.notifiedInvitations.map(({ id }) => id)).toEqual(["invitation-1"]);
    expect(state.auditEntries.map(({ action }) => action)).toEqual(["invitation.resent"]);
  });

  it("does not resend an accepted invitation or one from another organization", async () => {
    const resend = resendInvitation(dependencies());
    const results = await Promise.all([
      resend(actor("admin"), { invitationId: "invitation-2" }),
      resend(actor("admin"), { invitationId: "invitation-4" }),
    ]);
    expect(results.map((result) => !result.isOk && result.error)).toEqual([
      "invitation_not_found",
      "invitation_not_found",
    ]);
    expect(state.notifiedInvitations).toEqual([]);
  });

  it("refuses a secretary and an impersonation", async () => {
    const resend = resendInvitation(dependencies());
    await expect(resend(actor("secretary"), { invitationId: "invitation-1" })).rejects.toThrow(
      ForbiddenError,
    );
    await expect(resend(actor("owner", true), { invitationId: "invitation-1" })).rejects.toThrow(
      ForbiddenError,
    );
  });
});

describe("cancelInvitation", () => {
  it("cancels a pending invitation, which can no longer be accepted", async () => {
    const result = await cancelInvitation(dependencies())(actor("owner"), {
      invitationId: "invitation-1",
    });
    expect(result.isOk).toBe(true);
    expect(state.invitations[0]?.status).toBe("canceled");
    expect(state.auditEntries.map(({ action }) => action)).toEqual(["invitation.canceled"]);
  });

  it("does not reach another organization", async () => {
    const result = await cancelInvitation(dependencies())(actor("owner"), {
      invitationId: "invitation-4",
    });
    expect(result).toEqual({ isOk: false, error: "invitation_not_found" });
    expect(state.invitations[3]?.status).toBe("pending");
  });

  it("refuses a technician", async () => {
    await expect(
      cancelInvitation(dependencies())(actor("technician"), { invitationId: "invitation-1" }),
    ).rejects.toThrow(ForbiddenError);
  });
});
