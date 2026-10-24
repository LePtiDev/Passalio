import type { ServiceChanges, ServiceFields } from "@passalio/trades";

export type Service = ServiceFields & {
  readonly id: string;
  readonly organizationId: string;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ServiceRepository = {
  readonly listActive: (organizationId: string) => Promise<Service[]>;
  readonly findActive: (organizationId: string, serviceId: string) => Promise<Service | undefined>;
  readonly create: (service: Service) => Promise<void>;
  readonly update: (
    organizationId: string,
    serviceId: string,
    changes: ServiceChanges & { readonly updatedAt: Date },
  ) => Promise<void>;
  readonly archive: (organizationId: string, serviceId: string, at: Date) => Promise<void>;
};

export type ServiceDependencies = {
  readonly services: ServiceRepository;
  readonly now: () => Date;
};

export type ServiceError = "service_not_found";
