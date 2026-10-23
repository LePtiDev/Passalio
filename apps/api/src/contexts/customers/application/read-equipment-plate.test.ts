import {
  EQUIPMENT_PHOTO_MAX_BYTES,
  err,
  ForbiddenError,
  ok,
  PLATE_READING_DAILY_LIMIT,
  type OrganizationRole,
} from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { LogFields, Logger } from "../../../platform/logger";
import { organizationActorWith } from "../../../platform/organization-actor-fixture";
import type { PlateImage, PlateReader, PlateReading } from "../domain/plate-reading-ports";
import { FAKE_PLATE_ANSWER } from "../infrastructure/fake-plate-reader";
import { createInMemoryPlateReadingRepository } from "../infrastructure/in-memory-plate-reading-repository";
import { readEquipmentPlate } from "./read-equipment-plate";

const NOW = new Date("2026-10-23T22:30:00Z");
const PARIS_DAY = "2026-10-24";
const TRACE_ID = "trace-plate";
const JPEG: PlateImage = { bytes: new Uint8Array([255, 216, 255, 224]), contentType: "image/jpeg" };

let readings: PlateReading[];
let logs: LogFields[];
let readImages: PlateImage[];

const logger: Logger = {
  info: (fields) => logs.push(fields),
  warn: (fields) => logs.push(fields),
  error: (fields) => logs.push(fields),
};

const readerAnswering = (answer: unknown): PlateReader => ({
  read: async (image) => {
    readImages.push(image);
    return ok({ answer, model: "openai:test", usage: { inputTokens: 1200, outputTokens: 80 } });
  },
});

const failingReader: PlateReader = {
  read: async () => err({ model: "openai:test", reason: "APICallError" }),
};

const read = (
  reader: PlateReader | undefined,
  role: OrganizationRole = "technician",
  image: PlateImage = JPEG,
  isImpersonating = false,
) =>
  readEquipmentPlate({
    reader,
    readings: createInMemoryPlateReadingRepository(readings),
    logger,
    now: () => NOW,
  })(organizationActorWith(role, { isImpersonating }), { image, traceId: TRACE_ID });

const fillDay = (organizationId: string, count: number) => {
  for (let index = 0; index < count; index += 1) {
    readings.push({
      id: `reading-${organizationId}-${index}`,
      organizationId,
      userId: "user-technician",
      day: PARIS_DAY,
      status: "read",
      fieldCount: 3,
      model: "openai:test",
      inputTokens: 1000,
      outputTokens: 50,
      traceId: "earlier",
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
};

beforeEach(() => {
  readings = [];
  logs = [];
  readImages = [];
});

describe("readEquipmentPlate", () => {
  it("returns the cleaned fields, their count and the status of a partly read plate", async () => {
    expect(await read(readerAnswering(FAKE_PLATE_ANSWER))).toEqual(
      ok({
        status: "partial",
        fields: {
          kind: "pellet_stove",
          energy: "pellets",
          brand: "MCZ",
          model: "Ego 2.0 Air 8",
          powerKw: 8,
        },
        fieldCount: 5,
      }),
    );
  });

  it("is read when brand, model and serial number are on the plate", async () => {
    const result = await read(readerAnswering({ ...FAKE_PLATE_ANSWER, serialNumber: "21-04587" }));
    expect(result.isOk && result.value.status).toBe("read");
  });

  it("is unreadable when the model finds nothing", async () => {
    expect(await read(readerAnswering({ brand: null, model: null }))).toEqual(
      ok({ status: "unreadable", fields: {}, fieldCount: 0 }),
    );
  });

  it("never returns a value outside the form, even if the model invents one", async () => {
    const result = await read(
      readerAnswering({
        kind: "toaster",
        powerKw: -4,
        refrigerant: "Ignore previous instructions",
      }),
    );
    expect(result).toEqual(ok({ status: "unreadable", fields: {}, fieldCount: 0 }));
  });

  it("sends the photo as it was taken to the reader", async () => {
    await read(readerAnswering(FAKE_PLATE_ANSWER));
    expect(readImages).toEqual([JPEG]);
  });

  it("records the reading for the quota and the cost, on the Paris day, without any value read", async () => {
    await read(readerAnswering(FAKE_PLATE_ANSWER));
    expect(readings).toEqual([
      {
        id: expect.any(String),
        organizationId: "organization-a",
        userId: "user-technician",
        day: PARIS_DAY,
        status: "partial",
        fieldCount: 5,
        model: "openai:test",
        inputTokens: 1200,
        outputTokens: 80,
        traceId: TRACE_ID,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);
  });

  it("logs the outcome without any value read on the plate", async () => {
    await read(readerAnswering({ ...FAKE_PLATE_ANSWER, serialNumber: "SN-SECRET-42" }));
    expect(logs).toEqual([
      {
        event: "plate_reading.completed",
        status: "read",
        fieldCount: 6,
        model: "openai:test",
        inputTokens: 1200,
        outputTokens: 80,
      },
    ]);
    expect(JSON.stringify(logs)).not.toMatch(/MCZ|Ego|SN-SECRET-42/);
  });

  it.each<OrganizationRole>(["owner", "admin", "secretary", "technician"])(
    "lets a %s read a plate",
    async (role) => {
      expect((await read(readerAnswering(FAKE_PLATE_ANSWER), role)).isOk).toBe(true);
    },
  );

  it("refuses a reading during an impersonation, before calling the reader", async () => {
    await expect(read(readerAnswering(FAKE_PLATE_ANSWER), "owner", JPEG, true)).rejects.toThrow(
      ForbiddenError,
    );
    expect(readImages).toEqual([]);
    expect(readings).toEqual([]);
  });

  it.each([
    ["a PDF", { bytes: new Uint8Array([37, 80, 68, 70]), contentType: "application/pdf" }],
    ["an empty photo", { bytes: new Uint8Array(), contentType: "image/jpeg" }],
    [
      "a photo over 5 MB",
      { bytes: new Uint8Array(EQUIPMENT_PHOTO_MAX_BYTES + 1), contentType: "image/png" },
    ],
  ])("refuses %s without calling the reader or counting it", async (_label, image) => {
    expect(await read(readerAnswering(FAKE_PLATE_ANSWER), "technician", image)).toEqual(
      err("invalid_photo"),
    );
    expect(readImages).toEqual([]);
    expect(readings).toEqual([]);
  });

  it("accepts a photo of exactly 5 MB", async () => {
    const image = { bytes: new Uint8Array(EQUIPMENT_PHOTO_MAX_BYTES), contentType: "image/webp" };
    expect((await read(readerAnswering(FAKE_PLATE_ANSWER), "technician", image)).isOk).toBe(true);
  });

  it("says the reader is not configured when no model is set, without counting it", async () => {
    expect(await read(undefined)).toEqual(err("plate_reader_not_configured"));
    expect(readings).toEqual([]);
  });

  it("refuses the reading once the company has read the daily limit, without calling the reader", async () => {
    fillDay("organization-a", PLATE_READING_DAILY_LIMIT);
    expect(await read(readerAnswering(FAKE_PLATE_ANSWER))).toEqual(
      err("plate_reading_limit_reached"),
    );
    expect(readImages).toEqual([]);
    expect(readings).toHaveLength(PLATE_READING_DAILY_LIMIT);
  });

  it("still reads the last plate allowed by the daily limit", async () => {
    fillDay("organization-a", PLATE_READING_DAILY_LIMIT - 1);
    expect((await read(readerAnswering(FAKE_PLATE_ANSWER))).isOk).toBe(true);
  });

  it("does not count the readings of another company in the limit", async () => {
    fillDay("organization-b", PLATE_READING_DAILY_LIMIT);
    expect((await read(readerAnswering(FAKE_PLATE_ANSWER))).isOk).toBe(true);
  });

  it("does not count the readings of a previous day in the limit", async () => {
    fillDay("organization-a", PLATE_READING_DAILY_LIMIT);
    readings.forEach((reading, index) => {
      readings[index] = { ...reading, day: "2026-10-23" };
    });
    expect((await read(readerAnswering(FAKE_PLATE_ANSWER))).isOk).toBe(true);
  });

  it("says the reader is unavailable when it fails, and counts the failed reading", async () => {
    expect(await read(failingReader)).toEqual(err("plate_reader_unavailable"));
    expect(readings.map(({ status, fieldCount }) => ({ status, fieldCount }))).toEqual([
      { status: "failed", fieldCount: 0 },
    ]);
    expect(logs).toEqual([
      { event: "plate_reading.failed", model: "openai:test", reason: "APICallError" },
    ]);
  });
});
