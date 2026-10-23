import { describe, expect, it } from "vitest";
import type { TeamInvitation } from "./team-models";
import {
  checkNotSelf,
  checkTeamInvitationFor,
  checkTeamInvitationOpen,
  normalizeEmail,
  TEAM_INVITATION_LIFETIME_MS,
} from "./team-rules";

const NOW = new Date("2026-10-23T10:00:00Z");

const invitation = (overrides: Partial<TeamInvitation> = {}): TeamInvitation => ({
  id: "invitation-1",
  email: "antho@passalio.com",
  role: "sales",
  status: "pending",
  inviterId: "user-quentin",
  expiresAt: new Date(NOW.getTime() + 60_000),
  createdAt: new Date("2026-10-20T10:00:00Z"),
  ...overrides,
});

describe("team invitation lifetime", () => {
  it("lasts 7 days", () => {
    expect(TEAM_INVITATION_LIFETIME_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases an address", () => {
    expect(normalizeEmail("  Antho@Passalio.COM ")).toBe("antho@passalio.com");
  });
});

describe("checkTeamInvitationOpen", () => {
  it("accepts a pending invitation before its expiry", () => {
    const open = invitation();
    expect(checkTeamInvitationOpen(open, NOW)).toEqual({ isOk: true, value: open });
  });

  it("does not find a missing invitation", () => {
    expect(checkTeamInvitationOpen(undefined, NOW)).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
  });

  it.each(["accepted", "rejected", "canceled"] as const)(
    "does not find an invitation %s, even before its expiry",
    (status) => {
      expect(checkTeamInvitationOpen(invitation({ status }), NOW)).toEqual({
        isOk: false,
        error: "invitation_not_found",
      });
    },
  );

  it("treats an invitation as expired from its expiry time", () => {
    expect(checkTeamInvitationOpen(invitation({ expiresAt: NOW }), NOW)).toEqual({
      isOk: false,
      error: "invitation_expired",
    });
  });

  it("does not report a closed and expired invitation as expired", () => {
    expect(
      checkTeamInvitationOpen(
        invitation({ status: "canceled", expiresAt: new Date("2026-01-01T00:00:00Z") }),
        NOW,
      ),
    ).toEqual({ isOk: false, error: "invitation_not_found" });
  });
});

describe("checkTeamInvitationFor", () => {
  it("accepts the invited address whatever its case and spaces", () => {
    const open = invitation({ email: "Antho@Passalio.com" });
    expect(
      checkTeamInvitationFor(open, { userId: "user-antho", email: " antho@PASSALIO.com" }),
    ).toEqual({
      isOk: true,
      value: open,
    });
  });

  it("refuses another address", () => {
    expect(
      checkTeamInvitationFor(invitation(), { userId: "user-lea", email: "lea@passalio.com" }),
    ).toEqual({ isOk: false, error: "invitation_email_mismatch" });
  });
});

describe("checkNotSelf", () => {
  it("lets an actor act on someone else", () => {
    expect(checkNotSelf("user-quentin", "user-antho")).toEqual({ isOk: true, value: "user-antho" });
  });

  it("refuses an actor acting on themselves", () => {
    expect(checkNotSelf("user-quentin", "user-quentin")).toEqual({
      isOk: false,
      error: "cannot_change_own_role",
    });
  });
});
