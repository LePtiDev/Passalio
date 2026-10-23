import type { LocalDatabase } from "../db/local-database";
import { synchronize } from "./sync-engine";
import { setSyncStatus } from "./sync-status";

const SYNC_INTERVAL_MS = 60_000;
const REQUEST_DELAY_MS = 1_000;

const scheduled = new WeakSet<LocalDatabase>();
const pendingRequests = new WeakMap<LocalDatabase, ReturnType<typeof setTimeout>>();

const markOffline = () => setSyncStatus({ phase: "offline", error: null });

export const runSync = async (database: LocalDatabase) => {
  if (!navigator.onLine) {
    markOffline();
    return;
  }
  setSyncStatus({ phase: "syncing", error: null });
  const result = await synchronize(database);
  if (result.isOk) {
    setSyncStatus({ phase: "idle", error: null });
  } else if (result.error.code === "network") {
    markOffline();
  } else {
    setSyncStatus({ phase: "error", error: result.error });
  }
};

export const requestSync = (database: LocalDatabase) => {
  if (!scheduled.has(database)) {
    return;
  }
  clearTimeout(pendingRequests.get(database));
  pendingRequests.set(
    database,
    setTimeout(() => {
      void runSync(database);
    }, REQUEST_DELAY_MS),
  );
};

export const startSyncScheduler = (database: LocalDatabase) => {
  scheduled.add(database);
  const sync = () => {
    void runSync(database);
  };
  sync();
  window.addEventListener("online", sync);
  window.addEventListener("offline", markOffline);
  const interval = setInterval(sync, SYNC_INTERVAL_MS);
  return () => {
    scheduled.delete(database);
    clearTimeout(pendingRequests.get(database));
    clearInterval(interval);
    window.removeEventListener("online", sync);
    window.removeEventListener("offline", markOffline);
  };
};
