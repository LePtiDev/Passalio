import type { VisitTypeDependencies, VisitTypeSettings } from "../domain/visit-type-ports";

export const createInMemoryVisitTypeDependencies = (
  organizations: Map<string, VisitTypeSettings>,
): VisitTypeDependencies => ({
  settings: {
    find: async (organizationId) => organizations.get(organizationId),
    saveDurations: async (organizationId, durations) => {
      const current = organizations.get(organizationId);
      if (current !== undefined) {
        organizations.set(organizationId, { ...current, durations });
      }
    },
  },
});
