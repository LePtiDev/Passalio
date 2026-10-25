import { liveQuery } from "dexie";
import type { LocalDatabase } from "@/lib/db/local-database";
import { readIssuer } from "./issuer-store";

export const ISSUER_WAIT_MS = 15_000;

export const whenCompanyKnown = (database: LocalDatabase, timeoutMs: number) =>
  new Promise<boolean>((resolve) => {
    const finish = (isKnown: boolean) => {
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve(isKnown);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    const subscription = liveQuery(() => readIssuer(database)).subscribe({
      next: (issuer) => {
        if (issuer !== undefined && issuer.company !== null) {
          finish(true);
        }
      },
      error: () => finish(false),
    });
  });
