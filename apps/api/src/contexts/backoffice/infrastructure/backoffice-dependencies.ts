import type { Database } from "../../../platform/database";
import type { BackofficeDependencies } from "../domain/backoffice-ports";
import { createD1AccountReadModel } from "./d1-account-read-model";
import { createD1JournalReadModel } from "./d1-journal-read-model";

export const createBackofficeDependencies = (database: Database): BackofficeDependencies => ({
  readModel: { ...createD1AccountReadModel(database), ...createD1JournalReadModel(database) },
  now: () => new Date(),
});
