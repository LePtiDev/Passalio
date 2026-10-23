import { TERMS_VERSION } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as z from "zod";
import { signInAsAdmin } from "../admin-session";
import { APP_URL, startTestPlatform, TEST_PASSWORD, type TestPlatform } from "../test-platform";
import { joinOrganization } from "./organization-members";
import {
  createActiveOrganization,
  fromAddress,
  jsonRequest,
  statusesOfSequentialAttempts,
} from "./security-fixtures";

const OWNER_EMAIL = "aldegonde.fourcroy@courriel-test.fr";
const ROBOT = { name: "Eudoxie Plantagenêt", email: "eudoxie.plantagenet@courriel-test.fr" };
const INVITEE_EMAIL = "sigismond.tavernier@courriel-test.fr";
const PLATFORM_INVITEE_EMAIL = "ermengarde.coutelier@courriel-test.fr";

const SYNCED_CUSTOMER = {
  kind: "individual",
  firstName: "Anatole",
  lastName: "Brisemouton",
  email: "anatole.brisemouton@courriel-test.fr",
  phone: "06 98 87 76 65",
  billingAddress: "3 chemin des Hirondelles Perdues",
  notes: "Chien méchant, appeler Mme Brisemouton avant",
};

const SYNCED_SITE = {
  address: "41 rue Zénobie Carpentras",
  postalCode: "69007",
  city: "Lyon",
  buildingType: "apartment",
  occupantName: "Clodomir Pâquerette",
  occupantPhone: "07 65 54 43 32",
  accessNotes: "Code 4B12, interphone Pâquerette",
};

const PERSONAL_DATA = [
  OWNER_EMAIL,
  ROBOT.name,
  "Plantagenêt",
  ROBOT.email,
  INVITEE_EMAIL,
  "Sigismond",
  PLATFORM_INVITEE_EMAIL,
  SYNCED_CUSTOMER.firstName,
  SYNCED_CUSTOMER.lastName,
  SYNCED_CUSTOMER.email,
  SYNCED_CUSTOMER.phone,
  "0698877665",
  SYNCED_CUSTOMER.billingAddress,
  "Chien méchant",
  SYNCED_SITE.address,
  SYNCED_SITE.occupantName,
  SYNCED_SITE.occupantPhone,
  "0765544332",
  "Code 4B12",
];

const pushResponse = z.object({ results: z.array(z.object({ status: z.string() })) });

const CONSOLE_METHODS = ["debug", "log", "info", "warn", "error"] as const;

let platform: TestPlatform;
let consoleSpies: ReturnType<typeof spyOnConsole>;

const spyOnConsole = () =>
  CONSOLE_METHODS.map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));

const loggedLines = () =>
  consoleSpies.flatMap((spy) =>
    spy.mock.calls.map((call) => call.map((argument) => String(argument)).join(" ")),
  );

const leakedPersonalData = () =>
  loggedLines().flatMap((line) =>
    PERSONAL_DATA.filter((value) => line.toLowerCase().includes(value.toLowerCase())).map(
      (value) => ({ value, line }),
    ),
  );

const runRejectedAuthenticationFlows = async () => {
  const robotSignUp = await platform.request("/api/auth/sign-up/email", {
    ...jsonRequest({ ...ROBOT, password: TEST_PASSWORD, termsVersion: TERMS_VERSION }),
    headers: { "x-captcha-response": "jeton-refuse" },
  });
  expect(robotSignUp.status).toBe(403);
  const robotSignIn = await platform.request("/api/auth/sign-in/email", {
    ...jsonRequest({ email: OWNER_EMAIL, password: TEST_PASSWORD }),
    headers: { "x-captcha-response": "" },
  });
  expect(robotSignIn.status).toBe(400);
  const statuses = await statusesOfSequentialAttempts(11, () =>
    platform.request("/api/auth/sign-in/email", {
      ...jsonRequest({ email: OWNER_EMAIL, password: "mauvais-mot-de-passe" }),
      headers: fromAddress("203.0.113.90"),
    }),
  );
  expect(statuses[10]).toBe(429);
  const badReset = await platform.request(
    "/api/auth/reset-password",
    jsonRequest({ token: "jeton-inconnu", newPassword: "nouveau-mot-de-passe-2027" }),
  );
  expect(badReset.status).toBe(400);
  const shortPassword = await platform.request(
    "/api/auth/sign-up/email",
    jsonRequest({ ...ROBOT, password: "court", termsVersion: TERMS_VERSION }),
  );
  expect(shortPassword.status).toBe(400);
  await platform.request(
    "/api/auth/sign-in/magic-link",
    jsonRequest({ email: ROBOT.email, callbackURL: APP_URL }),
  );
};

const runSyncFlows = async (owner: string) => {
  const customerId = crypto.randomUUID();
  const pushed = await platform.request(
    "/api/sync/push",
    jsonRequest({
      mutations: [
        {
          id: crypto.randomUUID(),
          mutation: { type: "create_customer", customerId, customer: SYNCED_CUSTOMER },
        },
        {
          id: crypto.randomUUID(),
          mutation: {
            type: "add_site",
            siteId: crypto.randomUUID(),
            customerId,
            site: SYNCED_SITE,
          },
        },
        {
          id: crypto.randomUUID(),
          mutation: {
            type: "update_site",
            siteId: crypto.randomUUID(),
            changes: {
              occupantName: SYNCED_SITE.occupantName,
              accessNotes: SYNCED_SITE.accessNotes,
            },
          },
        },
      ],
    }),
    owner,
  );
  expect(pushed.status).toBe(200);
  const { results } = pushResponse.parse(await pushed.json());
  expect(results.map(({ status }) => status)).toEqual(["applied", "applied", "rejected"]);
  const invalid = await platform.request(
    "/api/sync/push",
    jsonRequest({
      mutations: [
        {
          id: crypto.randomUUID(),
          mutation: {
            type: "create_customer",
            customerId,
            customer: { ...SYNCED_CUSTOMER, email: SYNCED_CUSTOMER.phone },
          },
        },
      ],
    }),
    owner,
  );
  expect(invalid.status).toBe(400);
  const search = await platform.request(
    `/api/customers?q=${encodeURIComponent(SYNCED_CUSTOMER.phone)}`,
    {},
    owner,
  );
  expect(search.status).toBe(200);
};

beforeAll(async () => {
  platform = await startTestPlatform();
  consoleSpies = spyOnConsole();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("personal data in logs of refused requests and synced changes", () => {
  it("never logs the names, emails, phone numbers or notes used", async () => {
    const owner = await platform.signIn(OWNER_EMAIL);
    const organizationId = await createActiveOrganization(platform, owner, "Ramonage Refus");
    await runRejectedAuthenticationFlows();
    await joinOrganization(platform, owner, organizationId, INVITEE_EMAIL, "technician");
    const duplicate = await platform.request(
      "/api/invitations",
      jsonRequest({ email: INVITEE_EMAIL, role: "technician" }),
      owner,
    );
    expect(duplicate.status).toBeGreaterThanOrEqual(400);
    await runSyncFlows(owner);
    const superadmin = await signInAsAdmin(platform, "chef-journal@passalio.com");
    const platformInvitation = await platform.request(
      "/api/admin/team/invitations",
      jsonRequest({ email: PLATFORM_INVITEE_EMAIL, role: "sales" }),
      superadmin,
    );
    expect(platformInvitation.status).toBe(201);
    expect(loggedLines().some((line) => line.includes('"event":"auth_rejected"'))).toBe(true);
    expect(loggedLines().some((line) => line.includes('"event":"sync_mutations_rejected"'))).toBe(
      true,
    );
    expect(leakedPersonalData()).toEqual([]);
  }, 30_000);
});
