import { newId, type CustomerMutation } from "@passalio/shared";
import type { LocalDatabase } from "./local-database";

const ENTITY_KEYS: ReadonlySet<string> = new Set([
  "customerId",
  "siteId",
  "equipmentId",
  "replacesEquipmentId",
]);

const entityIdsOf = (mutation: CustomerMutation): string[] =>
  Object.entries(mutation).flatMap(([key, value]) =>
    ENTITY_KEYS.has(key) && typeof value === "string" ? [value] : [],
  );

export const enqueue = async (database: LocalDatabase, mutation: CustomerMutation) => {
  await database.outbox.add({
    id: newId(),
    mutation,
    entityIds: entityIdsOf(mutation),
    createdAt: new Date().toISOString(),
  });
};

export const pendingEntityIds = async (database: LocalDatabase): Promise<ReadonlySet<string>> => {
  const keys = await database.outbox.orderBy("entityIds").uniqueKeys();
  return new Set(keys.filter((key) => typeof key === "string"));
};
