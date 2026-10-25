import type { Service, ServiceDependencies } from "../domain/service-models";

export const createInMemoryServiceDependencies = (
  stored: Service[],
  now: () => Date = () => new Date(),
): ServiceDependencies => {
  const indexOfActive = (organizationId: string, serviceId: string) =>
    stored.findIndex(
      (service) =>
        service.organizationId === organizationId &&
        service.id === serviceId &&
        service.archivedAt === null,
    );
  const replace = (organizationId: string, serviceId: string, changes: Partial<Service>) => {
    const index = indexOfActive(organizationId, serviceId);
    const current = stored[index];
    if (current !== undefined) {
      stored[index] = { ...current, ...changes };
    }
  };
  return {
    services: {
      listActive: async (organizationId) =>
        stored.filter(
          (service) => service.organizationId === organizationId && service.archivedAt === null,
        ),
      findActive: async (organizationId, serviceId) =>
        stored[indexOfActive(organizationId, serviceId)],
      create: async (service) => {
        stored.push(service);
      },
      update: async (organizationId, serviceId, changes) => {
        replace(
          organizationId,
          serviceId,
          Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)),
        );
      },
      archive: async (organizationId, serviceId, at) => {
        replace(organizationId, serviceId, { archivedAt: at, updatedAt: at });
      },
    },
    now,
  };
};
