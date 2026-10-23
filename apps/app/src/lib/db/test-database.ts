import { Dexie } from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { LocalDatabase } from "./local-database";

export const createTestDatabase = () => {
  Dexie.dependencies.indexedDB = indexedDB;
  Dexie.dependencies.IDBKeyRange = IDBKeyRange;
  return new LocalDatabase(`test-${crypto.randomUUID()}`);
};
