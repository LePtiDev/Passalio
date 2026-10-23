import type { Intervention } from "../domain/intervention-models";
import type { InterventionPlace, SchedulingDependencies } from "../domain/scheduling-ports";

export type InMemorySchedulingState = {
  readonly interventions: Intervention[];
  readonly places: Map<string, InterventionPlace & { readonly organizationId: string }>;
  readonly members: Set<string>;
};

export const createInMemorySchedulingState = (): InMemorySchedulingState => ({
  interventions: [],
  places: new Map(),
  members: new Set(),
});

export const memberKey = (organizationId: string, userId: string) => `${organizationId}:${userId}`;

export const createInMemorySchedulingDependencies = (
  state: InMemorySchedulingState,
  now: () => Date = () => new Date(),
): SchedulingDependencies => {
  const findIn = (organizationId: string, id: string) =>
    state.interventions.find(
      (intervention) => intervention.organizationId === organizationId && intervention.id === id,
    );
  return {
    interventions: {
      exists: async (id) => state.interventions.some((intervention) => intervention.id === id),
      create: async (intervention) => {
        state.interventions.push(intervention);
      },
      findById: async (organizationId, id) => findIn(organizationId, id),
      update: async (organizationId, id, changes) => {
        const index = state.interventions.findIndex(
          (intervention) =>
            intervention.organizationId === organizationId && intervention.id === id,
        );
        const current = state.interventions[index];
        if (current !== undefined) {
          state.interventions[index] = {
            ...current,
            ...Object.fromEntries(
              Object.entries(changes).filter(([, value]) => value !== undefined),
            ),
          };
        }
      },
      changesAfter: async (organizationId, after, limit) =>
        state.interventions
          .filter((intervention) => intervention.organizationId === organizationId)
          .filter(
            ({ updatedAt, id }) =>
              after === undefined ||
              updatedAt > after.updatedAt ||
              (updatedAt.getTime() === after.updatedAt.getTime() && id > after.id),
          )
          .toSorted(
            (left, right) =>
              left.updatedAt.getTime() - right.updatedAt.getTime() ||
              left.id.localeCompare(right.id),
          )
          .slice(0, limit)
          .map((intervention) => ({ ...intervention, deletedAt: null })),
    },
    places: {
      siteOf: async (organizationId, siteId) => {
        const place = state.places.get(siteId);
        return place?.organizationId === organizationId ? place : undefined;
      },
    },
    team: {
      isMember: async (organizationId, userId) =>
        state.members.has(memberKey(organizationId, userId)),
    },
    now,
  };
};
