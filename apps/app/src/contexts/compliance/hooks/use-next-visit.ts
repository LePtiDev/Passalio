import { useLiveQuery } from "dexie-react-hooks";
import { useLocalSession } from "@/lib/db/local-database-context";
import type { InterventionRecord } from "@/lib/db/local-records";
import { nextVisitAfter } from "../next-visit";

export const useNextVisit = (current: InterventionRecord) => {
  const { database, actor } = useLocalSession();
  return useLiveQuery(
    () => nextVisitAfter(database, current, actor.userId),
    [database, current, actor.userId],
  );
};
