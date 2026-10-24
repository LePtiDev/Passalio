import type { Variables } from "../../../env";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import type { ServiceDependencies } from "../domain/service-models";
import { createD1ServiceRepository } from "../infrastructure/d1-service-repository";
import { createSchedulingDependencies } from "../infrastructure/scheduling-dependencies";

export const schedulingDependencies = (variables: Variables): SchedulingDependencies =>
  createSchedulingDependencies(variables.database);

export const serviceDependencies = (variables: Variables): ServiceDependencies => ({
  services: createD1ServiceRepository(variables.database),
  now: () => new Date(),
});
