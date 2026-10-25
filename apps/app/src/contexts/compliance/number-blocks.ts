import { DOCUMENT_NUMBER_REFILL_THRESHOLD, ok } from "@passalio/shared";
import type { ApiResult } from "@/lib/api-client";
import type { NumberBlockRecord } from "@/lib/db/compliance-records";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { complianceApi } from "./compliance-api";
import { signingDeviceIdOf } from "./signing-device";

type NumberRange = Pick<NumberBlockRecord, "numberPrefix" | "firstNumber" | "lastNumber">;

export type FreeNumber = { readonly number: number; readonly numberPrefix: string };

const numbersOf = ({ firstNumber, lastNumber }: NumberRange) =>
  Array.from({ length: lastNumber - firstNumber + 1 }, (_, index) => firstNumber + index);

export const freeNumbersOf = (
  blocks: readonly NumberRange[],
  usedNumbers: ReadonlySet<number>,
): readonly FreeNumber[] =>
  blocks
    .toSorted((left, right) => left.firstNumber - right.firstNumber)
    .flatMap((block) =>
      numbersOf(block)
        .filter((number) => !usedNumbers.has(number))
        .map((number) => ({ number, numberPrefix: block.numberPrefix })),
    );

export const freeNumbers = async (database: LocalDatabase, userId: string) => {
  const [blocks, usedNumbers] = await Promise.all([
    database.numberBlocks.where("userId").equals(userId).toArray(),
    database.documents.orderBy("number").uniqueKeys(),
  ]);
  return freeNumbersOf(blocks, new Set(usedNumbers.filter((number) => typeof number === "number")));
};

export const needsNumberRefill = (freeCount: number) =>
  freeCount < DOCUMENT_NUMBER_REFILL_THRESHOLD;

type Reserve = typeof complianceApi.reserveNumberBlock;

const reserveOne = async (
  database: LocalDatabase,
  userId: string,
  reserve: Reserve,
): Promise<ApiResult<number>> => {
  const free = await freeNumbers(database, userId);
  if (!needsNumberRefill(free.length)) {
    return ok(free.length);
  }
  const reserved = await reserve(await signingDeviceIdOf(database));
  if (!reserved.isOk) {
    return reserved;
  }
  const { id, deviceId, numberPrefix, firstNumber, lastNumber } = reserved.value;
  await database.numberBlocks.put({ id, userId, deviceId, numberPrefix, firstNumber, lastNumber });
  return ok(free.length + lastNumber - firstNumber + 1);
};

const running = new WeakMap<LocalDatabase, Promise<ApiResult<number>>>();

export const refillNumberBlocks = (
  database: LocalDatabase,
  userId: string,
  reserve: Reserve,
): Promise<ApiResult<number>> => {
  const current = running.get(database);
  if (current !== undefined) {
    return current;
  }
  const run = reserveOne(database, userId, reserve).finally(() => running.delete(database));
  running.set(database, run);
  return run;
};
