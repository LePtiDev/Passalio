import {
  prospectCompaniesPageResponse,
  prospectCompanyFileResponse,
  prospectCompanyResponse,
  prospectFollowUpResponse,
  publicCallbackResponse,
} from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import { app } from "../src/app";
import { WEBSITE_CALLBACKS_PER_HOUR } from "../src/contexts/sales/infrastructure/d1-visitor-rate-limit";
import { signInAsAdmin } from "./admin-session";
import { statusesOfSequentialAttempts } from "./security/security-fixtures";
import {
  SITE_URL,
  startTestPlatform,
  VALID_CAPTCHA_TOKEN,
  type TestPlatform,
} from "./test-platform";

const CALLBACK_PATH = "/api/public/callback-requests";
const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });

const CALLBACK = {
  firstName: "Paul",
  company: "Ramonage Paul",
  phone: "0143222222",
  postalCode: "94100",
  slot: "morning",
  message: "Plutôt après 10 h",
  pagePath: "/ramoneur",
  turnstileToken: VALID_CAPTCHA_TOKEN,
};

let platform: TestPlatform;
let admin: string;
let knownCompanyId: string;

const sendCallback = (
  body: unknown,
  { ipAddress = "203.0.113.10", origin = SITE_URL }: { ipAddress?: string; origin?: string } = {},
) =>
  app.request(
    CALLBACK_PATH,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: { origin, "content-type": "application/json", "cf-connecting-ip": ipAddress },
    },
    platform.env,
  );

const readAdmin = async <Schema extends z.ZodType>(path: string, schema: Schema) => {
  const response = await platform.request(`/api/admin/prospects${path}`, {}, admin);
  expect(response.status).toBe(200);
  return schema.parse(await response.json());
};

beforeAll(async () => {
  platform = await startTestPlatform();
  admin = await signInAsAdmin(platform, "quentin-site@passalio.com");
  const created = await platform.request(
    "/api/admin/prospects/companies",
    {
      method: "POST",
      body: JSON.stringify({ name: "Ramonage Paul", department: "94", phone: "01 43 22 22 22" }),
    },
    admin,
  );
  knownCompanyId = prospectCompanyResponse.parse(await created.json()).id;
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("website callback requests", () => {
  it("accepts a callback request from the site without a session", async () => {
    const response = await sendCallback(CALLBACK);
    expect(response.status).toBe(201);
    expect(publicCallbackResponse.parse(await response.json())).toEqual({ status: "received" });
    expect(response.headers.get("access-control-allow-origin")).toBe(SITE_URL);
  });

  it("adds an open callback task and a note to the company with the same phone", async () => {
    const [followUp, file] = await Promise.all([
      readAdmin(`/companies/${knownCompanyId}/follow-up`, prospectFollowUpResponse),
      readAdmin(`/companies/${knownCompanyId}`, prospectCompanyFileResponse),
    ]);
    expect(followUp.tasks).toEqual([
      expect.objectContaining({ kind: "callback", status: "open", notify: "at_time", owner: null }),
    ]);
    expect(file.events.map(({ body }) => body)).toContainEqual(
      expect.stringContaining("Demande de rappel depuis le site (page /ramoneur)."),
    );
  });

  it("answers the preflight of the site and exposes the trace header", async () => {
    const response = await app.request(
      CALLBACK_PATH,
      {
        method: "OPTIONS",
        headers: {
          origin: SITE_URL,
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      },
      platform.env,
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(SITE_URL);
    expect(response.headers.get("access-control-allow-methods")).toBe("POST");
  });

  it("does not allow another origin to read the answer", async () => {
    const response = await sendCallback(CALLBACK, {
      origin: "https://example.com",
      ipAddress: "203.0.113.11",
    });
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("exposes the trace header to the site", async () => {
    const response = await sendCallback(CALLBACK, { ipAddress: "203.0.113.12" });
    expect(response.headers.get("access-control-expose-headers")).toBe("x-trace-id");
  });

  it("refuses an invalid phone number", async () => {
    const response = await sendCallback(
      { ...CALLBACK, phone: "12" },
      { ipAddress: "203.0.113.13" },
    );
    expect(response.status).toBe(400);
  });

  it("refuses a request without a valid anti-robot token", async () => {
    const response = await sendCallback(
      { ...CALLBACK, turnstileToken: "jeton-invalide" },
      { ipAddress: "203.0.113.14" },
    );
    expect(response.status).toBe(403);
    expect(errorResponse.parse(await response.json()).error).toBe("robot_suspected");
  });

  it(`refuses more than ${WEBSITE_CALLBACKS_PER_HOUR} requests per hour from one address`, async () => {
    const statuses = await statusesOfSequentialAttempts(WEBSITE_CALLBACKS_PER_HOUR + 1, async () =>
      sendCallback({ ...CALLBACK, phone: "0611111111" }, { ipAddress: "203.0.113.15" }),
    );
    expect(statuses).toEqual([
      ...Array.from({ length: WEBSITE_CALLBACKS_PER_HOUR }, () => 201),
      429,
    ]);
  });

  it("creates an unknown company once, then reuses it", async () => {
    const unknownCaller = { ...CALLBACK, firstName: "Margaux", company: null, phone: "0699999999" };
    await sendCallback(unknownCaller, { ipAddress: "203.0.113.16" });
    await sendCallback(unknownCaller, { ipAddress: "203.0.113.17" });
    const page = await readAdmin("/companies?q=Margaux", prospectCompaniesPageResponse);
    expect(page.companies.map(({ name, department }) => ({ name, department }))).toEqual([
      { name: "Margaux", department: "94" },
    ]);
  });
});
