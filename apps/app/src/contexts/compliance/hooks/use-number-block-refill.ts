import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import type { LocalDatabase } from "@/lib/db/local-database";
import { complianceApi } from "../compliance-api";
import { freeNumbers, needsNumberRefill, refillNumberBlocks } from "../number-blocks";

export const useNumberBlockRefill = (database: LocalDatabase, userId: string, canSign: boolean) => {
  const freeCount = useLiveQuery(
    async () => (canSign ? (await freeNumbers(database, userId)).length : null),
    [database, userId, canSign],
  );
  useEffect(() => {
    const isNeeded = typeof freeCount === "number" && needsNumberRefill(freeCount);
    const refill = () => {
      if (isNeeded) {
        void refillNumberBlocks(database, userId, complianceApi.reserveNumberBlock);
      }
    };
    if (navigator.onLine) {
      refill();
    }
    window.addEventListener("online", refill);
    return () => window.removeEventListener("online", refill);
  }, [database, userId, freeCount]);
};
