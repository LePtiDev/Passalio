import { useEffect } from "react";
import type { LocalDatabase } from "@/lib/db/local-database";

export const useSignerName = (database: LocalDatabase, userId: string, name: string | null) => {
  useEffect(() => {
    if (name !== null && name.trim() !== "") {
      void database.localSettings.put({ key: "signer", userId, name: name.trim() });
    }
  }, [database, userId, name]);
};
