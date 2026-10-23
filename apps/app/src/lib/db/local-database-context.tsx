import { createContext, use, useEffect, useMemo, type ReactNode } from "react";
import { startSyncScheduler } from "../sync/sync-scheduler";
import { localDatabaseOf, type LocalDatabase } from "./local-database";

export type LocalSession = {
  readonly database: LocalDatabase;
  readonly actor: { readonly userId: string; readonly organizationId: string };
};

const LocalDatabaseContext = createContext<LocalSession | null>(null);

export const LocalDatabaseProvider = ({
  userId,
  organizationId,
  children,
}: {
  readonly userId: string;
  readonly organizationId: string;
  readonly children: ReactNode;
}) => {
  const session = useMemo(
    () => ({ database: localDatabaseOf(organizationId), actor: { userId, organizationId } }),
    [userId, organizationId],
  );
  useEffect(() => startSyncScheduler(session.database), [session.database]);
  return <LocalDatabaseContext value={session}>{children}</LocalDatabaseContext>;
};

export const useLocalSession = (): LocalSession => {
  const session = use(LocalDatabaseContext);
  if (session === null) {
    throw new Error("useLocalSession must be used inside LocalDatabaseProvider");
  }
  return session;
};
