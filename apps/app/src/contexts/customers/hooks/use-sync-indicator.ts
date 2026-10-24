import { useLocalSession } from "@/lib/db/local-database-context";
import { errorCodeLine } from "@/lib/errors";
import { useSyncStatus } from "@/lib/sync/use-sync-status";
import { customersFr } from "../fr";

const text = customersFr.sync;

export const useSyncIndicator = () => {
  const { database } = useLocalSession();
  const status = useSyncStatus(database);
  const isOffline = status.phase === "offline";
  const label = (() => {
    if (isOffline) {
      return text.offline(status.pendingCount);
    }
    if (status.phase === "error") {
      return text.error;
    }
    if (status.pendingCount > 0) {
      return text.pending(status.pendingCount);
    }
    return status.lastSyncedAt === null ? text.neverSynced : text.upToDate;
  })();
  const errorCode =
    status.phase === "error" && status.error !== null ? errorCodeLine(status.error) : undefined;
  return { ...status, isOffline, label, errorCode };
};
