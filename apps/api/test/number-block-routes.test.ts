import { DOCUMENT_NUMBER_BLOCK_SIZE, numberBlockResponse } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as z from "zod";
import {
  createChimneySweepingOrganization,
  impersonate,
  joinOrganization,
  jsonBody,
} from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const errorResponse = z.object({ error: z.string(), traceId: z.string() });

const DEVICE_ID = "0190f3a0-0000-7000-8000-0000000d0001";
const NUMBER_PREFIX = "RAM-";

let platform: TestPlatform;
let owner: string;
let organizationId: string;
let secretary: string;
let technician: string;

const reserve = (cookie: string | undefined, body: unknown = { deviceId: DEVICE_ID }) =>
  platform.request("/api/document-number-blocks", jsonBody(body), cookie);

const reservedBlock = async (cookie: string) => {
  const response = await reserve(cookie);
  expect(response.status).toBe(201);
  return numberBlockResponse.parse(await response.json());
};

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-blocs@example.fr");
  organizationId = await createChimneySweepingOrganization(platform, owner, "Ramonage Blocs");
  await platform.env.DB.prepare("UPDATE organizations SET document_number_prefix = ? WHERE id = ?")
    .bind(NUMBER_PREFIX, organizationId)
    .run();
  secretary = await joinOrganization(platform, {
    ownerCookie: owner,
    organizationId,
    email: "secretariat-blocs@example.fr",
    role: "secretary",
  });
  technician = await joinOrganization(platform, {
    ownerCookie: owner,
    organizationId,
    email: "technicien-blocs@example.fr",
    role: "technician",
  });
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("document number blocks", () => {
  it("asks to sign in before reserving numbers", async () => {
    expect((await reserve(undefined)).status).toBe(401);
  });

  it("refuses a reservation without a valid device id", async () => {
    expect((await reserve(owner, { deviceId: "not-a-uuid" })).status).toBe(400);
    expect((await reserve(owner, {})).status).toBe(400);
  });

  it("reserves a block of numbers for the device with the organization prefix", async () => {
    const block = await reservedBlock(owner);
    expect(block.deviceId).toBe(DEVICE_ID);
    expect(block.numberPrefix).toBe(NUMBER_PREFIX);
    expect(block.firstNumber).toBeGreaterThanOrEqual(1);
    expect(block.lastNumber - block.firstNumber + 1).toBe(DOCUMENT_NUMBER_BLOCK_SIZE);
  });

  it("gives consecutive blocks that never overlap", async () => {
    const first = await reservedBlock(owner);
    const second = await reservedBlock(technician);
    const third = await reservedBlock(owner);
    expect(second.firstNumber).toBe(first.lastNumber + 1);
    expect(third.firstNumber).toBe(second.lastNumber + 1);
    expect(new Set([first.id, second.id, third.id]).size).toBe(3);
  });

  it("advances the next document number of the organization", async () => {
    const block = await reservedBlock(owner);
    const row = await platform.env.DB.prepare(
      "SELECT next_document_number AS next FROM organizations WHERE id = ?",
    )
      .bind(organizationId)
      .first();
    expect(row).toEqual({ next: block.lastNumber + 1 });
  });

  it("refuses a block to the secretary who cannot sign documents", async () => {
    const response = await reserve(secretary);
    expect(response.status).toBe(403);
    expect(errorResponse.parse(await response.json()).error).toBe("forbidden");
  });

  it("refuses a reservation during an impersonation", async () => {
    const impersonated = await platform.signIn("patron-usurpe@example.fr");
    await createChimneySweepingOrganization(platform, impersonated, "Ramonage Usurpé");
    await impersonate(platform, impersonated, "support-blocs@example.fr");
    const response = await reserve(impersonated);
    expect(response.status).toBe(403);
    expect(errorResponse.parse(await response.json()).error).toBe("impersonation_read_only");
    const blocks = await platform.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM document_number_blocks WHERE user_id = (SELECT id FROM users WHERE email = 'patron-usurpe@example.fr')",
    ).first();
    expect(blocks).toEqual({ total: 0 });
  });
});
