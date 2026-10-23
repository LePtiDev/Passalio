import { teamInvitationDetailsResponse, teamResponse } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { signInAsAdmin } from "./admin-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

let platform: TestPlatform;
let superadmin: string;

const errorResponse = z.object({ error: z.string(), traceId: z.string() });

const send = (cookie: string, path: string, method = "GET", body?: unknown) =>
  platform.request(
    path,
    body === undefined ? { method } : { method, body: JSON.stringify(body) },
    cookie,
  );

const readTeam = async (cookie = superadmin) => {
  const response = await send(cookie, "/api/admin/team");
  expect(response.status).toBe(200);
  return teamResponse.parse(await response.json());
};

const errorOf = async (response: Response) => errorResponse.parse(await response.json()).error;

const invite = (email: string, role: string) =>
  send(superadmin, "/api/admin/team/invitations", "POST", { email, role });

const invitationIdFor = async (email: string) => {
  const invitation = (await readTeam()).invitations.find((entry) => entry.email === email);
  expect(invitation).toBeDefined();
  return invitation?.id ?? "";
};

const userIdOf = async (email: string) =>
  (await readTeam()).members.find((member) => member.email === email)?.id ?? "";

beforeAll(async () => {
  platform = await startTestPlatform();
  superadmin = await signInAsAdmin(platform, "quentin@passalio.com");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("team access", () => {
  it("hides the team from a regular user", async () => {
    const cookie = await platform.signIn("ramoneur@example.fr");
    expect((await send(cookie, "/api/admin/team")).status).toBe(404);
  });

  it("refuses the team to an admin who is not superadmin", async () => {
    const admin = await signInAsAdmin(platform, "lea@passalio.com", "admin");
    const response = await send(admin, "/api/admin/team");
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe("forbidden");
  });

  it("lists the members with their role and two-factor status", async () => {
    const team = await readTeam();
    expect(team.members).toContainEqual(
      expect.objectContaining({
        email: "quentin@passalio.com",
        role: "superadmin",
        isTwoFactorEnabled: true,
      }),
    );
    expect(team.members.find((member) => member.email === "ramoneur@example.fr")).toBeUndefined();
  });
});

describe("team invitations", () => {
  it("invites a new member and shows the pending invitation", async () => {
    const response = await invite(" Marie@Passalio.com ", "admin");
    expect(response.status).toBe(201);
    const team = await readTeam();
    expect(team.invitations).toContainEqual(
      expect.objectContaining({
        email: "marie@passalio.com",
        role: "admin",
        inviterName: "quentin",
      }),
    );
  });

  it("refuses to invite someone already in the team", async () => {
    const response = await invite("lea@passalio.com", "sales");
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("already_in_team");
  });

  it("replaces a pending invitation sent to the same address", async () => {
    await invite("paul@passalio.com", "sales");
    await invite("paul@passalio.com", "admin");
    const pending = (await readTeam()).invitations.filter(
      (entry) => entry.email === "paul@passalio.com",
    );
    expect(pending).toHaveLength(1);
    expect(pending[0]?.role).toBe("admin");
  });

  it("shows the invitation to the signed-in person and lets the right one join", async () => {
    const invitationId = await invitationIdFor("marie@passalio.com");
    const marie = await platform.signIn("marie@passalio.com");
    const details = await send(marie, `/api/team-invitations/${invitationId}`);
    expect(teamInvitationDetailsResponse.parse(await details.json()).invitation).toEqual({
      role: "admin",
      email: "marie@passalio.com",
      inviterName: "quentin",
    });

    const stranger = await platform.signIn("stranger@example.fr");
    const refused = await send(stranger, `/api/team-invitations/${invitationId}/accept`, "POST");
    expect(refused.status).toBe(403);
    expect(await errorOf(refused)).toBe("invitation_email_mismatch");

    const accepted = await send(marie, `/api/team-invitations/${invitationId}/accept`, "POST");
    expect(accepted.status).toBe(200);
    const team = await readTeam();
    expect(team.members).toContainEqual(
      expect.objectContaining({ email: "marie@passalio.com", role: "admin" }),
    );
    expect(team.invitations.find((entry) => entry.id === invitationId)).toBeUndefined();

    const again = await send(marie, `/api/team-invitations/${invitationId}/accept`, "POST");
    expect(again.status).toBe(404);
  });

  it("asks to sign in before showing an invitation", async () => {
    const response = await platform.request("/api/team-invitations/anything");
    expect(response.status).toBe(401);
  });

  it("tells when an invitation has expired", async () => {
    await invite("expired@passalio.com", "sales");
    const invitationId = await invitationIdFor("expired@passalio.com");
    await platform.env.DB.prepare("UPDATE platform_invitations SET expires_at = ? WHERE id = ?")
      .bind(Date.now() - 1000, invitationId)
      .run();
    const cookie = await platform.signIn("expired@passalio.com");
    const response = await send(cookie, `/api/team-invitations/${invitationId}`);
    expect(response.status).toBe(410);
    expect(await errorOf(response)).toBe("invitation_expired");
  });

  it("resends then cancels an invitation", async () => {
    await invite("julie@passalio.com", "sales");
    const invitationId = await invitationIdFor("julie@passalio.com");
    const path = `/api/admin/team/invitations/${invitationId}`;
    expect((await send(superadmin, `${path}/resend`, "POST")).status).toBe(200);
    expect((await send(superadmin, path, "DELETE")).status).toBe(204);
    expect((await send(superadmin, `${path}/resend`, "POST")).status).toBe(404);
  });
});

describe("team roles", () => {
  it("changes a role and closes the sessions of that person", async () => {
    const antho = await signInAsAdmin(platform, "antho@passalio.com", "sales");
    const userId = await userIdOf("antho@passalio.com");
    const changed = await send(superadmin, `/api/admin/team/members/${userId}`, "PATCH", {
      role: "admin",
    });
    expect(changed.status).toBe(200);
    expect((await readTeam()).members).toContainEqual(
      expect.objectContaining({ email: "antho@passalio.com", role: "admin" }),
    );
    expect((await send(antho, "/api/admin/me")).status).toBe(404);
  });

  it("refuses to change one's own role", async () => {
    const userId = await userIdOf("quentin@passalio.com");
    const response = await send(superadmin, `/api/admin/team/members/${userId}`, "PATCH", {
      role: "sales",
    });
    expect(response.status).toBe(409);
    expect(await errorOf(response)).toBe("cannot_change_own_role");
  });

  it("removes a member from the team and records it in the journal", async () => {
    const userId = await userIdOf("antho@passalio.com");
    expect((await send(superadmin, `/api/admin/team/members/${userId}`, "DELETE")).status).toBe(
      204,
    );
    expect((await readTeam()).members.find((member) => member.id === userId)).toBeUndefined();
    const audit = await platform.env.DB.prepare(
      "SELECT action FROM audit_logs WHERE target_id = ? ORDER BY created_at",
    )
      .bind(userId)
      .all<{ action: string }>();
    expect(audit.results.map((row) => row.action)).toEqual(
      expect.arrayContaining(["platform.role_changed", "platform.role_revoked"]),
    );
  });
});
