import { PLATE_READING_DAILY_LIMIT, parisDay, plateReadingResponse } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import {
  createChimneySweepingOrganization,
  impersonate,
  joinOrganization,
  userIdOf,
} from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const errorResponse = z.object({ error: z.string(), traceId: z.string().min(1) });
const countRow = z.object({ total: z.number() });

const JPEG = new Uint8Array([255, 216, 255, 224, 0, 16]);

let platform: TestPlatform;
let owner: string;
let organizationId: string;
let technician: string;
let otherOwner: string;
let otherOrganizationId: string;

const readPlate = (
  cookie: string | undefined,
  body: Uint8Array = JPEG,
  contentType = "image/jpeg",
) =>
  platform.request(
    "/api/plate-readings",
    { method: "POST", body, headers: { "content-type": contentType } },
    cookie,
  );

const readingsOf = async (organization: string) =>
  countRow.parse(
    await platform.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM plate_readings WHERE organization_id = ?",
    )
      .bind(organization)
      .first(),
  ).total;

const fillToday = async (organization: string, count: number) => {
  const now = Date.now();
  const day = parisDay(new Date(now));
  const statement = platform.env.DB.prepare(
    "INSERT INTO plate_readings (id, organization_id, user_id, day, status, field_count, model, input_tokens, output_tokens, trace_id, created_at, updated_at) VALUES (?, ?, 'user', ?, 'read', 3, 'fake', 0, 0, 'filled', ?, ?)",
  );
  await platform.env.DB.batch(
    Array.from({ length: count }, (_, index) =>
      statement.bind(`filled-${organization}-${index}`, organization, day, now, now),
    ),
  );
};

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-plaque@example.fr");
  organizationId = await createChimneySweepingOrganization(platform, owner, "Ramonage Plaque");
  technician = await joinOrganization(platform, {
    ownerCookie: owner,
    organizationId,
    email: "technicien-plaque@example.fr",
    role: "technician",
  });
  otherOwner = await platform.signIn("patron-plaque-b@example.fr");
  otherOrganizationId = await createChimneySweepingOrganization(
    platform,
    otherOwner,
    "Ramonage Plaque B",
  );
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("POST /api/plate-readings", () => {
  it("asks to sign in before reading a plate", async () => {
    const response = await readPlate(undefined);
    expect(response.status).toBe(401);
  });

  it("returns the fields read on the plate, with the status and the count", async () => {
    const response = await readPlate(technician);
    expect(response.status).toBe(200);
    expect(plateReadingResponse.parse(await response.json())).toEqual({
      status: "partial",
      fields: {
        kind: "pellet_stove",
        energy: "pellets",
        brand: "MCZ",
        model: "Ego 2.0 Air 8",
        powerKw: 8,
      },
      fieldCount: 5,
    });
  });

  it("records each reading for the company, with the user and the trace id, and nothing read", async () => {
    const before = await readingsOf(organizationId);
    const response = await readPlate(owner);
    expect(response.status).toBe(200);
    expect(await readingsOf(organizationId)).toBe(before + 1);
    const row = await platform.env.DB.prepare(
      "SELECT * FROM plate_readings WHERE organization_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1",
    )
      .bind(organizationId, await userIdOf(platform, owner))
      .first();
    expect(row).toMatchObject({ status: "partial", field_count: 5, model: "fake" });
    expect(Object.keys(row ?? {}).toSorted()).toEqual(
      [
        "created_at",
        "day",
        "field_count",
        "id",
        "input_tokens",
        "model",
        "organization_id",
        "output_tokens",
        "status",
        "trace_id",
        "updated_at",
        "user_id",
      ].toSorted(),
    );
  });

  it("refuses a file that is not a photo", async () => {
    const response = await readPlate(owner, new Uint8Array([37, 80, 68, 70]), "application/pdf");
    expect(response.status).toBe(422);
    expect(errorResponse.parse(await response.json()).error).toBe("invalid_photo");
  });

  it("refuses an empty photo", async () => {
    const response = await readPlate(owner, new Uint8Array());
    expect(response.status).toBe(422);
  });

  it("refuses a photo announced over 5 MB before reading it", async () => {
    const response = await platform.request(
      "/api/plate-readings",
      {
        method: "POST",
        body: JPEG,
        headers: { "content-type": "image/jpeg", "content-length": String(6 * 1024 * 1024) },
      },
      owner,
    );
    expect(response.status).toBe(422);
  });

  it("refuses a reading during an impersonation and records nothing", async () => {
    const impersonated = await platform.signIn("patron-plaque-usurpe@example.fr");
    const impersonatedOrganization = await createChimneySweepingOrganization(
      platform,
      impersonated,
      "Ramonage Plaque Usurpé",
    );
    await impersonate(platform, impersonated, "support-plaque@example.fr");
    const response = await readPlate(impersonated);
    expect(response.status).toBe(403);
    expect(errorResponse.parse(await response.json()).error).toBe("impersonation_read_only");
    expect(await readingsOf(impersonatedOrganization)).toBe(0);
  });

  it("refuses the reading once the company reached the daily limit, with a trace id", async () => {
    const limited = await platform.signIn("patron-plaque-limite@example.fr");
    const limitedOrganization = await createChimneySweepingOrganization(
      platform,
      limited,
      "Ramonage Plaque Limite",
    );
    await fillToday(limitedOrganization, PLATE_READING_DAILY_LIMIT);
    const response = await readPlate(limited);
    expect(response.status).toBe(429);
    expect(errorResponse.parse(await response.json()).error).toBe("plate_reading_limit_reached");
    expect(await readingsOf(limitedOrganization)).toBe(PLATE_READING_DAILY_LIMIT);
  });

  it("does not count another company's readings in the limit", async () => {
    await fillToday(otherOrganizationId, PLATE_READING_DAILY_LIMIT);
    expect((await readPlate(otherOwner)).status).toBe(429);
    expect((await readPlate(technician)).status).toBe(200);
  });

  it("counts the daily readings with the organization and day index", async () => {
    const plan = await platform.env.DB.prepare(
      "EXPLAIN QUERY PLAN SELECT COUNT(*) FROM plate_readings WHERE organization_id = ? AND day = ?",
    )
      .bind(organizationId, parisDay(new Date()))
      .all();
    expect(JSON.stringify(plan.results)).toContain("plate_readings_organization_id_day_idx");
  });

  it("never logs a value read on the plate", async () => {
    await readPlate(owner);
    const lines = platform.loggedLines().filter((line) => line.includes("plate_reading"));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.join("\n")).not.toMatch(/MCZ|Ego 2\.0/);
  });
});
