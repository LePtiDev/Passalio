import type { Variables } from "../../../env";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import { createSchedulingDependencies } from "../infrastructure/scheduling-dependencies";

export const schedulingDependencies = (variables: Variables): SchedulingDependencies =>
  createSchedulingDependencies(variables.database);
