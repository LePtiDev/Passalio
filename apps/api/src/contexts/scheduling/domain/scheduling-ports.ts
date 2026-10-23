import type { ChangesAfter } from "@passalio/shared";
import type { Intervention, InterventionChangeSet } from "./intervention-models";

export type InterventionRepository = {
  readonly exists: (id: string) => Promise<boolean>;
  readonly create: (intervention: Intervention) => Promise<void>;
  readonly findById: (
    organizationId: string,
    interventionId: string,
  ) => Promise<Intervention | undefined>;
  readonly update: (
    organizationId: string,
    interventionId: string,
    changes: InterventionChangeSet,
  ) => Promise<void>;
  readonly changesAfter: ChangesAfter<Intervention>;
};

export type InterventionPlace = {
  readonly customerId: string;
  readonly equipmentIds: readonly string[];
};

export type InterventionPlaces = {
  readonly siteOf: (
    organizationId: string,
    siteId: string,
  ) => Promise<InterventionPlace | undefined>;
};

export type TeamMembers = {
  readonly isMember: (organizationId: string, userId: string) => Promise<boolean>;
};

export type SchedulingDependencies = {
  readonly interventions: InterventionRepository;
  readonly places: InterventionPlaces;
  readonly team: TeamMembers;
  readonly now: () => Date;
};
