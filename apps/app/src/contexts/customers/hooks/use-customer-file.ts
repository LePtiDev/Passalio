import { useLiveQuery } from "dexie-react-hooks";
import { useLocalSession } from "@/lib/db/local-database-context";
import { pendingEntityIds } from "@/lib/db/outbox";
import { customerFileOf } from "../customer-queries";

export const useCustomerFile = (customerId: string) => {
  const { database } = useLocalSession();
  return useLiveQuery(async () => {
    const file = await customerFileOf(database, customerId);
    if (file === undefined) {
      return null;
    }
    const pending = await pendingEntityIds(database);
    return { ...file, isPending: pending.has(customerId), today: new Date() };
  }, [database, customerId]);
};

export type CustomerFile = NonNullable<ReturnType<typeof useCustomerFile>>;
