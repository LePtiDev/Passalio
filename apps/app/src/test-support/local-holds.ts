import type { LocalDatabase } from "@/lib/db/local-database";
import { createGate } from "./gate";

export const holdLocalDatabaseOpening = (database: LocalDatabase) => {
  if (database.isOpen()) {
    throw new Error("the local database is already open and cannot be held");
  }
  const gate = createGate();
  database.on("ready", () => gate.opened);
  return { release: gate.open };
};
