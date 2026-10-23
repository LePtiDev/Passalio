import type { Bindings, Variables } from "../../../env";
import type { PlateReadingDependencies } from "../application/read-equipment-plate";
import { createD1PlateReadingRepository } from "../infrastructure/d1-plate-reading-repository";
import { createPlateReader } from "../infrastructure/plate-reader-models";

export const plateReadingDependencies = (
  variables: Variables,
  bindings: Bindings,
): PlateReadingDependencies => ({
  reader: createPlateReader(bindings),
  readings: createD1PlateReadingRepository(variables.database),
  logger: variables.logger,
  now: () => new Date(),
});
