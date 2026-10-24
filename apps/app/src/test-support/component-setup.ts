import { cleanup } from "@testing-library/react";
import { Dexie } from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { afterEach, vi } from "vitest";
import { deleteLocalDatabases } from "@/lib/db/local-database";
import { setSyncStatus } from "@/lib/sync/sync-status";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  setSyncStatus({ phase: "idle", error: null });
  await deleteLocalDatabases();
});
