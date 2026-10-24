import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo } from "react";
import { useLocalSession } from "@/lib/db/local-database-context";
import { inTradeOrder } from "../visit-types";
import { refreshVisitTypes } from "../visit-types-store";

export const useOfferedVisitTypes = () => {
  const { database } = useLocalSession();
  const stored = useLiveQuery(() => database.visitTypes.toArray(), [database]);
  useEffect(() => {
    if (navigator.onLine) {
      void refreshVisitTypes(database);
    }
  }, [database]);
  return useMemo(() => (stored === undefined ? undefined : inTradeOrder(stored)), [stored]);
};
