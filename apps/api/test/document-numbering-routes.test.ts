import { numberBlockResponse } from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createChimneySweepingOrganization, jsonBody } from "./team-session";
import { startTestPlatform, type TestPlatform } from "./test-platform";

const DEVICE_ID = "0190f3a0-0000-7000-8000-0000000d0002";

let platform: TestPlatform;
let owner: string;

const reservedBlock = async () => {
  const response = await platform.request(
    "/api/document-number-blocks",
    jsonBody({ deviceId: DEVICE_ID }),
    owner,
  );
  expect(response.status).toBe(201);
  return numberBlockResponse.parse(await response.json());
};

const changeNextNumber = (nextDocumentNumber: number) =>
  platform.request("/api/organization", jsonBody({ nextDocumentNumber }, "PATCH"), owner);

beforeAll(async () => {
  platform = await startTestPlatform();
  owner = await platform.signIn("patron-numeros@example.fr");
  await createChimneySweepingOrganization(platform, owner, "Ramonage Numéros");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("document numbering once numbers are reserved", () => {
  it("refuses to move the next number back over numbers already given to a device", async () => {
    const block = await reservedBlock();
    const response = await changeNextNumber(block.firstNumber);
    expect(response.status).toBe(409);
    const next = await reservedBlock();
    expect(next.firstNumber).toBe(block.lastNumber + 1);
  });

  it("still lets the company move the next number forward", async () => {
    const block = await reservedBlock();
    expect((await changeNextNumber(block.lastNumber + 100)).status).toBe(204);
    expect((await reservedBlock()).firstNumber).toBe(block.lastNumber + 100);
  });
});
