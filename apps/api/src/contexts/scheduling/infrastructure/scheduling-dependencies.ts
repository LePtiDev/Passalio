import type { Database } from "../../../platform/database";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import { createD1InterventionPlaces, createD1TeamMembers } from "./d1-intervention-places";
import { createD1InterventionRepository } from "./d1-intervention-repository";
import { createD1ServiceCatalog } from "./d1-service-repository";

export const createSchedulingDependencies = (database: Database): SchedulingDependencies => ({
  interventions: createD1InterventionRepository(database),
  places: createD1InterventionPlaces(database),
  team: createD1TeamMembers(database),
  catalog: createD1ServiceCatalog(database),
  now: () => new Date(),
});
