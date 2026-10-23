import { TERMS_VERSION } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as z from "zod";
import { APP_URL, startTestPlatform, TEST_PASSWORD, type TestPlatform } from "../test-platform";
import { createActiveOrganization, jsonRequest } from "./security-fixtures";

const OWNER = {
  name: "Héloïse Vasseur-Quintard",
  email: "heloise.vasseur@courriel-test.fr",
};

const TECHNICIAN_EMAIL = "barnabe.octavien@courriel-test.fr";

const CUSTOMER = {
  firstName: "Philibert",
  lastName: "Dagobertini",
  email: "philibert.dagobertini@courriel-test.fr",
  phone: "06 71 82 93 04",
  secondaryPhone: "01 47 58 69 70",
  billingAddress: "17 impasse des Ramoneurs Oubliés",
};

const SITE = {
  address: "9 allée Clothilde Zéphyrin",
  postalCode: "69003",
  city: "Lyon",
  buildingType: "house",
  occupantName: "Gontran Marcassin",
  occupantPhone: "07 12 23 34 45",
};

const COMPANY_CUSTOMER = {
  companyName: "Boulangerie Fulbert Escarbille",
  email: "fulbert.escarbille@courriel-test.fr",
  phone: "04 78 89 90 01",
};

const PERSONAL_DATA = [
  OWNER.name,
  "Vasseur",
  OWNER.email,
  TECHNICIAN_EMAIL,
  CUSTOMER.firstName,
  CUSTOMER.lastName,
  CUSTOMER.email,
  CUSTOMER.phone,
  "0671829304",
  "671829304",
  CUSTOMER.secondaryPhone,
  "0147586970",
  CUSTOMER.billingAddress,
  SITE.address,
  SITE.occupantName,
  SITE.occupantPhone,
  "0712233445",
  COMPANY_CUSTOMER.companyName,
  COMPANY_CUSTOMER.email,
  COMPANY_CUSTOMER.phone,
  "0478899001",
];

const CONSOLE_METHODS = ["debug", "log", "info", "warn", "error"] as const;

const createdResponse = z.object({ customer: z.object({ id: z.string() }) });

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

const signUpOwner = () =>
  platform.request(
    "/api/auth/sign-up/email",
    jsonRequest({ ...OWNER, password: TEST_PASSWORD, termsVersion: TERMS_VERSION }),
  );

const runAuthenticationFlows = async () => {
  const signedUp = await signUpOwner();
  expect(signedUp.status).toBe(200);
  expect((await signUpOwner()).status).toBe(422);
  const withoutTerms = await platform.request(
    "/api/auth/sign-up/email",
    jsonRequest({ name: OWNER.name, email: CUSTOMER.email, password: TEST_PASSWORD }),
  );
  expect(withoutTerms.status).toBe(400);
  const wrongPassword = await platform.request(
    "/api/auth/sign-in/email",
    jsonRequest({ email: OWNER.email, password: "mauvais-mot-de-passe" }),
  );
  expect(wrongPassword.status).toBe(401);
  await platform.request(
    "/api/auth/request-password-reset",
    jsonRequest({ email: OWNER.email, redirectTo: `${APP_URL}/mot-de-passe/nouveau` }),
  );
  await platform.request(
    "/api/auth/sign-in/magic-link",
    jsonRequest({ email: OWNER.email, callbackURL: APP_URL }),
  );
  return platform.sessionCookieOf(signedUp);
};

const runCustomerFlows = async (owner: string) => {
  const created = await platform.request(
    "/api/customers",
    jsonRequest({ customer: { kind: "individual", ...CUSTOMER }, site: SITE }),
    owner,
  );
  expect(created.status).toBe(201);
  const { customer } = createdResponse.parse(await created.json());
  const company = await platform.request(
    "/api/customers",
    jsonRequest({ customer: { kind: "company", ...COMPANY_CUSTOMER } }),
    owner,
  );
  expect(company.status).toBe(201);
  await platform.request(
    `/api/customers/${customer.id}`,
    jsonRequest({ phone: CUSTOMER.secondaryPhone, email: COMPANY_CUSTOMER.email }, "PATCH"),
    owner,
  );
  await platform.request(`/api/customers?q=${encodeURIComponent(CUSTOMER.lastName)}`, {}, owner);
  const invalid = await platform.request(
    "/api/customers",
    jsonRequest({ customer: { kind: "individual", ...CUSTOMER, email: "pas-un-email" } }),
    owner,
  );
  expect(invalid.status).toBe(400);
  const pushed = await platform.request(
    "/api/sync/push",
    jsonRequest({
      mutations: [
        {
          id: crypto.randomUUID(),
          mutation: {
            type: "update_customer",
            customerId: crypto.randomUUID(),
            changes: { lastName: CUSTOMER.lastName, phone: CUSTOMER.phone },
          },
        },
      ],
    }),
    owner,
  );
  expect(pushed.status).toBe(200);
};

beforeAll(async () => {
  platform = await startTestPlatform();
  consoleSpies = spyOnConsole();
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("personal data in logs", () => {
  it("never logs the names, emails or phone numbers used in the main flows", async () => {
    const owner = await runAuthenticationFlows();
    await createActiveOrganization(platform, owner, "Ramonage Journal");
    const invited = await platform.request(
      "/api/invitations",
      jsonRequest({ email: TECHNICIAN_EMAIL, role: "technician" }),
      owner,
    );
    expect(invited.status).toBe(201);
    await runCustomerFlows(owner);
    expect(loggedLines().some((line) => line.includes('"event":"email_logged"'))).toBe(true);
    expect(loggedLines().some((line) => line.includes('"event":"auth_rejected"'))).toBe(true);
    expect(loggedLines().some((line) => line.includes('"event":"sync_mutations_rejected"'))).toBe(
      true,
    );
    expect(leakedPersonalData()).toEqual([]);
  });
});
