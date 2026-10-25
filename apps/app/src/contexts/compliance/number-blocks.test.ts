import {
  DOCUMENT_NUMBER_REFILL_THRESHOLD,
  err,
  ok,
  type NumberBlockResponse,
} from "@passalio/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiResult } from "@/lib/api-client";
import type { LocalDatabase } from "@/lib/db/local-database";
import { createTestDatabase } from "@/lib/db/test-database";
import { serverDocumentRecord } from "@/lib/sync/planning-test-records";
import { numberBlock } from "@/test-support/certificate-records";
import { freeNumbers, freeNumbersOf, refillNumberBlocks } from "./number-blocks";
import { signingDeviceIdOf } from "./signing-device";

let database: LocalDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

const signedWith = (number: number) => ({
  ...serverDocumentRecord(`document-${number}`, "intervention-1", "equipment-1"),
  number,
});

const reserved = (firstNumber: number): NumberBlockResponse => ({
  id: `block-${firstNumber}`,
  deviceId: "0190f3a0-0000-7000-8000-00000000d001",
  numberPrefix: "RD-",
  firstNumber,
  lastNumber: firstNumber + 19,
});

const reserveReturning = (result: ApiResult<NumberBlockResponse>) =>
  vi.fn<(deviceId: string) => Promise<ApiResult<NumberBlockResponse>>>(async () => result);

describe("freeNumbersOf", () => {
  it("lists the numbers of the blocks in order, without the used ones", () => {
    const free = freeNumbersOf(
      [
        { numberPrefix: "B-", firstNumber: 21, lastNumber: 22 },
        { numberPrefix: "A-", firstNumber: 1, lastNumber: 3 },
      ],
      new Set([2, 21]),
    );
    expect(free).toEqual([
      { number: 1, numberPrefix: "A-" },
      { number: 3, numberPrefix: "A-" },
      { number: 22, numberPrefix: "B-" },
    ]);
  });

  it("gives nothing without a block", () => {
    expect(freeNumbersOf([], new Set())).toEqual([]);
  });
});

describe("freeNumbers", () => {
  it("only counts the blocks of the user and skips the numbers already signed", async () => {
    await database.numberBlocks.bulkPut([
      numberBlock({ firstNumber: 1, lastNumber: 3 }),
      numberBlock({ id: "block-2", userId: "user-2", firstNumber: 4, lastNumber: 6 }),
    ]);
    await database.documents.bulkPut([signedWith(1), signedWith(5)]);
    expect(await freeNumbers(database, "user-1")).toEqual([
      { number: 2, numberPrefix: "RD-" },
      { number: 3, numberPrefix: "RD-" },
    ]);
  });
});

describe("refillNumberBlocks", () => {
  it("reserves a block for this device when numbers run low", async () => {
    const reserve = reserveReturning(ok(reserved(1)));
    expect(await refillNumberBlocks(database, "user-1", reserve)).toEqual(ok(20));
    expect(await database.numberBlocks.toArray()).toEqual([{ ...reserved(1), userId: "user-1" }]);
    expect(reserve).toHaveBeenCalledWith(await signingDeviceIdOf(database));
  });

  it("does not reserve while enough numbers are left", async () => {
    await database.numberBlocks.put(
      numberBlock({ firstNumber: 1, lastNumber: DOCUMENT_NUMBER_REFILL_THRESHOLD }),
    );
    const reserve = reserveReturning(ok(reserved(100)));
    expect(await refillNumberBlocks(database, "user-1", reserve)).toEqual(
      ok(DOCUMENT_NUMBER_REFILL_THRESHOLD),
    );
    expect(reserve).not.toHaveBeenCalled();
  });

  it("reserves again once the numbers left fall under the threshold", async () => {
    await database.numberBlocks.put(
      numberBlock({ firstNumber: 1, lastNumber: DOCUMENT_NUMBER_REFILL_THRESHOLD }),
    );
    await database.documents.put(signedWith(1));
    const reserve = reserveReturning(ok(reserved(21)));
    expect(await refillNumberBlocks(database, "user-1", reserve)).toEqual(
      ok(DOCUMENT_NUMBER_REFILL_THRESHOLD - 1 + 20),
    );
    expect(reserve).toHaveBeenCalledTimes(1);
  });

  it("returns the server error and stores nothing", async () => {
    const failure = err({ code: "network", traceId: null });
    expect(await refillNumberBlocks(database, "user-1", reserveReturning(failure))).toEqual(
      failure,
    );
    expect(await database.numberBlocks.count()).toBe(0);
  });

  it("reserves a single block when asked twice at the same time", async () => {
    const reserve = reserveReturning(ok(reserved(1)));
    await Promise.all([
      refillNumberBlocks(database, "user-1", reserve),
      refillNumberBlocks(database, "user-1", reserve),
    ]);
    expect(reserve).toHaveBeenCalledTimes(1);
    expect(await database.numberBlocks.count()).toBe(1);
  });
});
