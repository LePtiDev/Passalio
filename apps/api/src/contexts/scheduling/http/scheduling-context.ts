import type { Variables } from "../../../env";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import type { VisitTypeDependencies } from "../domain/visit-type-ports";
import { createD1VisitTypeSettings } from "../infrastructure/d1-visit-type-settings";
import { createSchedulingDependencies } from "../infrastructure/scheduling-dependencies";

export const schedulingDependencies = (variables: Variables): SchedulingDependencies =>
  createSchedulingDependencies(variables.database);

export const visitTypeDependencies = (variables: Variables): VisitTypeDependencies => ({
  settings: createD1VisitTypeSettings(variables.database),
});
