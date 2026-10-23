import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import {
  inMemoryInvitation,
  seedOrganizationOf,
} from "../infrastructure/in-memory-identity-fixtures";
import { acceptInvitation } from "./accept-invitation";

const EXPIRES_AT = new Date("2026-10-30T10:00:00Z");

let state: InMemoryIdentityState;
let now: Date;
const run = () => acceptInvitation(createInMemoryIdentityDependencies(state, () => now));
const lea = { userId: "user-lea", email: "lea@example.fr", isImpersonating: false };
const input = { organizationId: "organization-a", invitationId: "invitation-1" };

beforeEach(() => {
  state = createInMemoryIdentityState();
  now = new Date("2026-10-23T10:00:00Z");
  seedOrganizationOf(state, "organization-a");
  seedOrganizationOf(state, "organization-b", "-b");
  state.users.push({ id: lea.userId, name: "Léa", email: lea.email });
  state.invitations.push(
    inMemoryInvitation({
      id: "invitation-1",
      organizationId: "organization-a",
      email: lea.email,
      role: "secretary",
      expiresAt: EXPIRES_AT,
    }),
  );
});

describe("acceptInvitation", () => {
  it("adds the invitee with the invited role, closes the invitation and logs it", async () => {
    const result = await run()(lea, input);
    const member = state.members.find(({ userId }) => userId === lea.userId);
    expect(member).toMatchObject({ organizationId: "organization-a", role: "secretary" });
    expect(result).toEqual({ isOk: true, value: member });
    expect(state.invitations[0]?.status).toBe("accepted");
    expect(state.auditEntries).toEqual([
      {
        organizationId: "organization-a",
        actorUserId: lea.userId,
        action: "invitation.accepted",
        targetType: "member",
        targetId: member?.id,
        data: { role: "secretary", invitationId: "invitation-1" },
      },
    ]);
  });

  it("accepts the invited address written with other case and spaces", async () => {
    expect((await run()({ ...lea, email: " LEA@example.fr " }, input)).isOk).toBe(true);
  });

  it("refuses a person signed in with another address", async () => {
    expect(await run()({ ...lea, email: "intruder@example.fr" }, input)).toEqual({
      isOk: false,
      error: "invitation_email_mismatch",
    });
    expect(state.invitations[0]?.status).toBe("pending");
  });

  it("refuses an invitation at its expiry time", async () => {
    now = EXPIRES_AT;
    expect(await run()(lea, input)).toEqual({ isOk: false, error: "invitation_expired" });
  });

  it("cannot be accepted twice", async () => {
    await run()(lea, input);
    expect(await run()(lea, input)).toEqual({ isOk: false, error: "invitation_not_found" });
    expect(state.members.filter(({ userId }) => userId === lea.userId)).toHaveLength(1);
  });

  it.each(["canceled", "rejected"] as const)("refuses an invitation %s", async (status) => {
    state.invitations.splice(
      0,
      1,
      inMemoryInvitation({
        id: "invitation-1",
        organizationId: "organization-a",
        email: lea.email,
        status,
      }),
    );
    expect(await run()(lea, input)).toEqual({ isOk: false, error: "invitation_not_found" });
  });

  it("does not find the invitation through another organization", async () => {
    expect(await run()(lea, { ...input, organizationId: "organization-b" })).toEqual({
      isOk: false,
      error: "invitation_not_found",
    });
  });

  it("refuses someone already in the team", async () => {
    state.invitations.push(
      inMemoryInvitation({
        id: "invitation-2",
        organizationId: "organization-a",
        email: "technician@example.fr",
        role: "admin",
      }),
    );
    expect(
      await run()(
        { userId: "user-technician", email: "technician@example.fr", isImpersonating: false },
        { organizationId: "organization-a", invitationId: "invitation-2" },
      ),
    ).toEqual({ isOk: false, error: "already_member" });
    expect(state.members.find(({ userId }) => userId === "user-technician")?.role).toBe(
      "technician",
    );
  });

  it("refuses during an impersonation", async () => {
    expect(await run()({ ...lea, isImpersonating: true }, input)).toEqual({
      isOk: false,
      error: "impersonation_read_only",
    });
    expect(state.invitations[0]?.status).toBe("pending");
  });
});
