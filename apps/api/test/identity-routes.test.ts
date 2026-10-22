import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const organizationResponse = z.object({ organization: z.object({ id: z.string() }) });
const membersResponse = z.object({
  members: z.array(z.object({ id: z.string(), email: z.string(), role: z.string() })),
  nextCursor: z.string().nullable(),
});
const errorResponse = z.object({ error: z.string(), traceId: z.string() });

let platform: TestPlatform;

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

const createOrganization = async (cookie: string, name: string) => {
  const response = await platform.request("/api/organizations", json({ name }), cookie);
  expectStatus(response, 201);
  const { organization } = organizationResponse.parse(await response.json());
  expectStatus(await platform.setActiveOrganization(cookie, organization.id), 200);
  return organization.id;
};

const listMembers = async (cookie: string) => {
  const response = await platform.request("/api/members", {}, cookie);
  expectStatus(response, 200);
  return membersResponse.parse(await response.json()).members;
};

const memberIdOf = async (cookie: string, email: string) =>
  (await listMembers(cookie)).find((member) => member.email === email)?.id ?? "";

const expectStatus = (response: Response, status: number) => {
  if (response.status !== status) {
    throw new Error(`Expected ${status}, received ${response.status}`);
  }
};

const errorOf = async (response: Response) => errorResponse.parse(await response.json()).error;

let ownerA: string;
let technicianA: string;
let ownerB: string;
let organizationA: string;
let organizationB: string;

beforeAll(async () => {
  platform = await startTestPlatform();
  ownerA = await platform.signIn("patron-a@example.fr");
  organizationA = await createOrganization(ownerA, "Ramonage A");
  ownerB = await platform.signIn("patron-b@example.fr");
  organizationB = await createOrganization(ownerB, "Ramonage B");

  const invited = await platform.request(
    "/api/invitations",
    json({ email: "tech-a@example.fr", role: "technician" }),
    ownerA,
  );
  expectStatus(invited, 201);
  const invitationPath = new URL(platform.lastLoggedUrl()).pathname;
  technicianA = await platform.signIn("tech-a@example.fr");
  const accepted = await platform.request(
    `/api${invitationPath}/accept`,
    { method: "POST" },
    technicianA,
  );
  expectStatus(accepted, 201);
  await platform.setActiveOrganization(technicianA, organizationA);
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("team of an organization", () => {
  it("shows the owner and the technician who accepted the invitation", async () => {
    const members = await listMembers(technicianA);
    expect(
      members
        .map(({ email, role }) => `${email} ${role}`)
        .toSorted((left, right) => left.localeCompare(right)),
    ).toEqual(["patron-a@example.fr owner", "tech-a@example.fr technician"]);
  });

  it("tells the app who is signed in and with which role", async () => {
    const response = await platform.request("/api/me", {}, technicianA);
    expect(await response.json()).toEqual({
      actor: {
        userId: expect.any(String),
        organizationId: organizationA,
        role: "technician",
        isImpersonating: false,
      },
    });
  });

  it("refuses an invitation from a technician", async () => {
    const response = await platform.request(
      "/api/invitations",
      json({ email: "x@example.fr", role: "technician" }),
      technicianA,
    );
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe("forbidden");
  });

  it("lets the owner change a role and writes the audit log with the trace id", async () => {
    const memberId = await memberIdOf(ownerA, "tech-a@example.fr");
    const response = await platform.request(
      `/api/members/${memberId}`,
      json({ role: "secretary" }, "PATCH"),
      ownerA,
    );
    expect(response.status).toBe(204);
    const traceId = response.headers.get("x-trace-id");
    const logged = await platform.env.DB.prepare(
      "SELECT action, trace_id FROM audit_logs WHERE target_id = ? AND action = 'member.role_changed'",
    )
      .bind(memberId)
      .first();
    expect(logged).toEqual({ action: "member.role_changed", trace_id: traceId });
    await platform.request(
      `/api/members/${memberId}`,
      json({ role: "technician" }, "PATCH"),
      ownerA,
    );
  });

  it("refuses to remove the owner", async () => {
    const ownerMemberId = await memberIdOf(ownerA, "patron-a@example.fr");
    const response = await platform.request(
      `/api/members/${ownerMemberId}`,
      { method: "DELETE" },
      ownerA,
    );
    expect(response.status).toBe(409);
  });
});

describe("isolation between organizations", () => {
  it("lists only the members of the active organization", async () => {
    const members = await listMembers(ownerB);
    expect(members.map(({ email }) => email)).toEqual(["patron-b@example.fr"]);
  });

  it("cannot change or remove a member of another organization", async () => {
    const technicianMemberId = await memberIdOf(ownerA, "tech-a@example.fr");
    const patched = await platform.request(
      `/api/members/${technicianMemberId}`,
      json({ role: "admin" }, "PATCH"),
      ownerB,
    );
    expect(patched.status).toBe(404);
    const removed = await platform.request(
      `/api/members/${technicianMemberId}`,
      { method: "DELETE" },
      ownerB,
    );
    expect(removed.status).toBe(404);
    expect(await memberIdOf(ownerA, "tech-a@example.fr")).toBe(technicianMemberId);
  });

  it("cannot open another organization", async () => {
    const response = await platform.setActiveOrganization(ownerB, organizationA);
    expect(response.status).toBe(403);
    expect((await platform.request("/api/members", {}, ownerB)).status).toBe(403);
    expect((await platform.setActiveOrganization(ownerB, organizationB)).status).toBe(200);
  });

  it("cannot take an ownership transfer to another organization", async () => {
    const technicianMemberId = await memberIdOf(ownerA, "tech-a@example.fr");
    const response = await platform.request(
      "/api/ownership-transfer",
      json({ memberId: technicianMemberId }),
      ownerB,
    );
    expect(response.status).toBe(404);
  });

  it("cannot accept an invitation sent to someone else", async () => {
    await platform.request(
      "/api/invitations",
      json({ email: "secretaire-a@example.fr", role: "secretary" }),
      ownerA,
    );
    const invitationPath = new URL(platform.lastLoggedUrl()).pathname;
    const response = await platform.request(
      `/api${invitationPath}/accept`,
      { method: "POST" },
      ownerB,
    );
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe("invitation_email_mismatch");
  });
});

describe("access rules", () => {
  it("asks to sign in without a session", async () => {
    const response = await platform.request("/api/members");
    expect(response.status).toBe(401);
  });

  it("asks for an organization when none is active", async () => {
    const newcomer = await platform.signIn("nouveau@example.fr");
    const response = await platform.request("/api/members", {}, newcomer);
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe("no_active_organization");
  });

  it("hides Better Auth endpoints that bypass the use cases", async () => {
    const responses = await Promise.all(
      ["/api/auth/organization/create", "/api/auth/admin/list-users"].map((path) =>
        platform.request(path, json({ name: "x", slug: "x" }), ownerA),
      ),
    );
    expect(responses.map(({ status }) => status)).toEqual([404, 404]);
  });

  it("logs every new session in the audit log", async () => {
    const row = await platform.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM audit_logs WHERE action = 'session.created'",
    ).first();
    expect(row).toEqual({ total: 4 });
  });
});

describe("impersonation", () => {
  it("allows reading but refuses every write", async () => {
    const supportUser = await platform.signIn("support@example.fr");
    expect(supportUser).not.toBe("");
    const token = decodeURIComponent(technicianA.split("=")[1] ?? "").split(".")[0];
    await platform.env.DB.prepare(
      "UPDATE sessions SET impersonated_by = (SELECT id FROM users WHERE email = 'support@example.fr'), impersonation_reason = 'Demande de support' WHERE token = ?",
    )
      .bind(token)
      .run();

    expect((await platform.request("/api/members", {}, technicianA)).status).toBe(200);
    const write = await platform.request(
      "/api/organizations",
      json({ name: "Ramonage C" }),
      technicianA,
    );
    expect(write.status).toBe(403);
    expect(await errorOf(write)).toBe("impersonation_read_only");
  });
});

const pendingInvitationsResponse = z.object({
  invitations: z.array(z.object({ id: z.string(), email: z.string(), role: z.string() })),
  nextCursor: z.string().nullable(),
});

const pendingEmails = async (cookie: string) => {
  const response = await platform.request("/api/invitations", {}, cookie);
  expectStatus(response, 200);
  return pendingInvitationsResponse
    .parse(await response.json())
    .invitations.map(({ email }) => email);
};

describe("pending invitations", () => {
  it("lists, resends and cancels an invitation, only within the organization", async () => {
    await platform.request(
      "/api/invitations",
      json({ email: "apprenti-a@example.fr", role: "technician" }),
      ownerA,
    );
    const invitationPath = new URL(platform.lastLoggedUrl()).pathname;
    const invitationId = invitationPath.split("/").at(-1) ?? "";
    expect(await pendingEmails(ownerA)).toContain("apprenti-a@example.fr");
    expect(await pendingEmails(ownerB)).toEqual([]);

    const resent = await platform.request(
      `/api/invitations/${invitationId}/resend`,
      { method: "POST" },
      ownerA,
    );
    expect(resent.status).toBe(200);
    expect(new URL(platform.lastLoggedUrl()).pathname).toBe(invitationPath);

    const canceledByOther = await platform.request(
      `/api/invitations/${invitationId}`,
      { method: "DELETE" },
      ownerB,
    );
    expect(canceledByOther.status).toBe(404);

    const canceled = await platform.request(
      `/api/invitations/${invitationId}`,
      { method: "DELETE" },
      ownerA,
    );
    expect(canceled.status).toBe(204);
    expect(await pendingEmails(ownerA)).not.toContain("apprenti-a@example.fr");

    const invitee = await platform.signIn("apprenti-a@example.fr");
    const accepted = await platform.request(
      `/api${invitationPath}/accept`,
      { method: "POST" },
      invitee,
    );
    expect(accepted.status).toBe(404);
  });
});
