import {
  signUpAvailabilityResponse,
  signUpSettingsResponse,
  TERMS_VERSION,
} from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { signInAsAdmin } from "./admin-session";
import { createChimneySweepingOrganization, jsonBody } from "./team-session";
import { startTestPlatform, TEST_PASSWORD, type TestPlatform } from "./test-platform";

let platform: TestPlatform;
let superadmin: string;
let owner: string;

const settingsBody = z.object({ settings: signUpSettingsResponse });
const errorResponse = z.object({ error: z.string(), traceId: z.string() });
const authErrorResponse = z.object({ code: z.string() });

const readSettings = async (cookie = superadmin) =>
  platform.request("/api/admin/settings/sign-up", {}, cookie);

const changeSettings = (isSignUpOpen: unknown, cookie = superadmin) =>
  platform.request("/api/admin/settings/sign-up", jsonBody({ isSignUpOpen }, "PUT"), cookie);

const signUp = (email: string) =>
  platform.request("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      name: "Nouveau Ramoneur",
      email,
      password: TEST_PASSWORD,
      termsVersion: TERMS_VERSION,
    }),
  });

const signInWithPassword = (email: string) =>
  platform.request("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });

const availability = async () => {
  const response = await platform.request("/api/sign-up-availability");
  expect(response.status).toBe(200);
  return signUpAvailabilityResponse.parse(await response.json()).isSignUpOpen;
};

beforeAll(async () => {
  platform = await startTestPlatform();
  superadmin = await signInAsAdmin(platform, "quentin@passalio.com");
  owner = await platform.signIn("patron-inscriptions@example.fr");
  await createChimneySweepingOrganization(platform, owner, "Ramonage Déjà Inscrit");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("sign-up settings access", () => {
  it("shows the superadmin that sign-up is open by default", async () => {
    const response = await readSettings();
    expect(response.status).toBe(200);
    expect(settingsBody.parse(await response.json()).settings).toEqual({
      isSignUpOpen: true,
      changedAt: null,
      changedByName: null,
    });
  });

  it("refuses the settings to an admin who is not superadmin", async () => {
    const admin = await signInAsAdmin(platform, "lea@passalio.com", "admin");
    const read = await readSettings(admin);
    const change = await changeSettings(false, admin);
    expect(read.status).toBe(403);
    expect(errorResponse.parse(await read.json()).error).toBe("forbidden");
    expect(change.status).toBe(403);
    expect(await availability()).toBe(true);
  });

  it("refuses the settings to a sales member", async () => {
    const sales = await signInAsAdmin(platform, "antho@passalio.com", "sales");
    expect((await readSettings(sales)).status).toBe(403);
    expect((await changeSettings(false, sales)).status).toBe(403);
  });

  it("hides the settings from a customer", async () => {
    expect((await readSettings(owner)).status).toBe(404);
    expect((await changeSettings(false, owner)).status).toBe(404);
  });

  it("refuses the settings without a session", async () => {
    expect((await platform.request("/api/admin/settings/sign-up")).status).toBe(404);
  });

  it("refuses a change that is not a yes or no", async () => {
    const response = await changeSettings("non");
    expect(response.status).toBe(400);
    expect(await availability()).toBe(true);
  });
});

describe("closed sign-up", () => {
  it("closes sign-up for the superadmin and shows who did it and when", async () => {
    expect((await changeSettings(false)).status).toBe(200);
    const settings = settingsBody.parse(await (await readSettings()).json()).settings;
    expect(settings).toEqual({
      isSignUpOpen: false,
      changedAt: expect.any(String),
      changedByName: "quentin",
    });
  });

  it("tells the sign-up page that sign-up is closed", async () => {
    expect(await availability()).toBe(false);
  });

  it("refuses a new account with a clear code", async () => {
    const response = await signUp("inconnu@example.fr");
    expect(response.status).toBe(403);
    expect(authErrorResponse.parse(await response.json()).code).toBe("SIGN_UP_CLOSED");
    const user = await platform.env.DB.prepare("SELECT id FROM users WHERE email = ?")
      .bind("inconnu@example.fr")
      .first();
    expect(user).toBeNull();
  });

  it("still lets the superadmin and existing customers sign in", async () => {
    expect((await signInWithPassword("quentin@passalio.com")).status).toBe(200);
    expect((await signInWithPassword("patron-inscriptions@example.fr")).status).toBe(200);
  });

  it("lets a person invited by a company create an account", async () => {
    const invited = await platform.request(
      "/api/invitations",
      jsonBody({ email: "Technicien.Invite@example.fr", role: "technician" }),
      owner,
    );
    expect(invited.status).toBe(201);
    expect((await signUp("technicien.invite@example.fr")).status).toBe(200);
  });

  it("lets a person invited to the Passalio team create an account", async () => {
    const invited = await platform.request(
      "/api/admin/team/invitations",
      jsonBody({ email: "marie@passalio.com", role: "sales" }),
      superadmin,
    );
    expect(invited.status).toBe(201);
    expect((await signUp("marie@passalio.com")).status).toBe(200);
  });

  it("refuses a new company to a signed-in person while sign-up is closed", async () => {
    const response = await platform.request(
      "/api/organizations",
      jsonBody({ name: "Ramonage Refusé" }),
      await platform.signIn("technicien.invite@example.fr"),
    );
    expect(response.status).toBe(403);
    expect(errorResponse.parse(await response.json()).error).toBe("sign_up_closed");
  });

  it("records the closing in the platform journal", async () => {
    const entry = await platform.env.DB.prepare(
      "SELECT organization_id, target_type FROM audit_logs WHERE action = 'platform.sign_up_closed'",
    ).first();
    expect(entry).toEqual({ organization_id: null, target_type: "platform_settings" });
  });
});

describe("reopened sign-up", () => {
  it("lets anyone create an account again", async () => {
    expect((await changeSettings(true)).status).toBe(200);
    expect(await availability()).toBe(true);
    expect((await signUp("apres-reouverture@example.fr")).status).toBe(200);
  });
});
