import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import { useLocalSession } from "@/lib/db/local-database-context";
import { refreshServices } from "../services-store";

export const useOfferedServices = () => {
  const { database } = useLocalSession();
  const stored = useLiveQuery(() => database.services.toArray(), [database]);
  useEffect(() => {
    if (navigator.onLine) {
      void refreshServices(database);
    }
  }, [database]);
  return stored;
};
