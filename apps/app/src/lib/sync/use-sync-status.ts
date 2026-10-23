import { useLiveQuery } from "dexie-react-hooks";
import type { LocalDatabase } from "../db/local-database";
import { useSyncPhase } from "./sync-status";

export const useSyncStatus = (database: LocalDatabase) => {
  const { phase, error } = useSyncPhase();
  const counts = useLiveQuery(
    async () => ({
      pendingCount: (await database.outbox.count()) + (await database.pendingPhotos.count()),
      rejectedCount: await database.rejections.count(),
      lastSyncedAt: (await database.syncState.get("lastSyncedAt"))?.value ?? null,
    }),
    [database],
  );
  return {
    phase,
    error,
    isLoaded: counts !== undefined,
    pendingCount: counts?.pendingCount ?? 0,
    rejectedCount: counts?.rejectedCount ?? 0,
    lastSyncedAt: counts?.lastSyncedAt ?? null,
  };
};
