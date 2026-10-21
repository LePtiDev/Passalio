import { describe, expect, it } from "vitest";
import type { Invitation, UserActor } from "./identity-models";
import {
  checkAssignableRole,
  checkInvitationAcceptable,
  checkMemberIsNotOwner,
} from "./membership-rules";

const NOW = new Date("2026-10-21T10:00:00Z");

const invitation = (overrides: Partial<Invitation> = {}): Invitation => ({
  id: "invitation-1",
  organizationId: "organization-1",
  email: "Technicien@Example.fr",
  role: "technician",
  status: "pending",
  inviterId: "user-owner",
  expiresAt: new Date("2026-10-28T10:00:00Z"),
  ...overrides,
});

const invitee: UserActor = {
  userId: "user-2",
  email: "technicien@example.fr",
  isImpersonating: false,
};

describe("checkAssignableRole", () => {
  it("never lets anyone hand out the owner role", () => {
    expect(checkAssignableRole("owner")).toEqual({
      isOk: false,
      error: "owner_role_not_assignable",
    });
    expect(checkAssignableRole("secretary")).toEqual({ isOk: true, value: "secretary" });
  });
});

describe("checkMemberIsNotOwner", () => {
  it("protects the owner", () => {
    expect(
      checkMemberIsNotOwner({ id: "m", organizationId: "o", userId: "u", role: "owner" }).isOk,
    ).toBe(false);
  });
});

describe("checkInvitationAcceptable", () => {
  it("accepts a pending invitation for the same email, whatever the case", () => {
    expect(checkInvitationAcceptable(invitation(), invitee, NOW).isOk).toBe(true);
  });

  it.each<[Partial<Invitation>, string]>([
    [{ status: "accepted" }, "invitation_not_found"],
    [{ expiresAt: NOW }, "invitation_expired"],
    [{ email: "autre@example.fr" }, "invitation_email_mismatch"],
  ])("refuses %o with %s", (overrides, error) => {
    expect(checkInvitationAcceptable(invitation(overrides), invitee, NOW)).toEqual({
      isOk: false,
      error,
    });
  });
});
