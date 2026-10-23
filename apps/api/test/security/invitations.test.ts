import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestPlatform, type TestPlatform } from "../test-platform";
import { createActiveOrganization, jsonRequest } from "./security-fixtures";

let platform: TestPlatform;
let ownerA: string;
let ownerB: string;

const invite = async (email: string) => {
  const response = await platform.request(
    "/api/invitations",
    jsonRequest({ email, role: "technician" }),
    ownerA,
  );
  expect(response.status).toBe(201);
  const path = new URL(platform.lastLoggedUrl()).pathname;
  return { path, id: path.split("/").at(-1) ?? "" };
};

const resend = (invitationId: string, cookie: string) =>
  platform.request(`/api/invitations/${invitationId}/resend`, { method: "POST" }, cookie);

const cancel = (invitationId: string, cookie: string) =>
  platform.request(`/api/invitations/${invitationId}`, { method: "DELETE" }, cookie);

beforeAll(async () => {
  platform = await startTestPlatform();
  ownerA = await platform.signIn("patron-invitations-a@example.fr");
  await createActiveOrganization(platform, ownerA, "Ramonage Invitations A");
  ownerB = await platform.signIn("patron-invitations-b@example.fr");
  await createActiveOrganization(platform, ownerB, "Ramonage Invitations B");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("pending invitations answer not found", () => {
  it("when the invitation belongs to another organization", async () => {
    const invitation = await invite("autre-entreprise@example.fr");
    expect((await resend(invitation.id, ownerB)).status).toBe(404);
    expect((await cancel(invitation.id, ownerB)).status).toBe(404);
    expect((await resend(invitation.id, ownerA)).status).toBe(200);
  });

  it("when the invitation has been accepted", async () => {
    const invitation = await invite("acceptee@example.fr");
    const invitee = await platform.signIn("acceptee@example.fr");
    const accepted = await platform.request(
      `/api${invitation.path}/accept`,
      { method: "POST" },
      invitee,
    );
    expect(accepted.status).toBe(201);
    expect((await resend(invitation.id, ownerA)).status).toBe(404);
    expect((await cancel(invitation.id, ownerA)).status).toBe(404);
  });

  it("when the invitation has been canceled", async () => {
    const invitation = await invite("annulee@example.fr");
    expect((await cancel(invitation.id, ownerA)).status).toBe(204);
    expect((await resend(invitation.id, ownerA)).status).toBe(404);
    expect((await cancel(invitation.id, ownerA)).status).toBe(404);
  });
});
