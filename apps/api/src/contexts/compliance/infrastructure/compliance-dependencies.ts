import type { Database } from "../../../platform/database";
import type { ComplianceDependencies } from "../domain/compliance-ports";
import { createD1DocumentRepository } from "./d1-document-repository";
import { createD1NumberBlockRepository } from "./d1-number-block-repository";
import { createD1SigningTargets } from "./d1-signing-targets";

export const createComplianceDependencies = (database: Database): ComplianceDependencies => ({
  documents: createD1DocumentRepository(database),
  numberBlocks: createD1NumberBlockRepository(database),
  targets: createD1SigningTargets(database),
  now: () => new Date(),
});
