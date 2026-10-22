import type { Database } from "../../../platform/database";
import type { CustomerDependencies } from "../domain/customer-ports";
import { createD1CustomerRepository } from "./d1-customer-repository";
import { createD1EquipmentRepository } from "./d1-equipment-repository";
import { createD1OrganizationTrades } from "./d1-organization-trades";
import { createD1PhotoRepository } from "./d1-photo-repository";
import { createD1SiteRepository } from "./d1-site-repository";
import { createR2PhotoStorage } from "./r2-photo-storage";

export type CustomerInfrastructure = {
  readonly database: Database;
  readonly files: R2Bucket;
};

export const createCustomerDependencies = ({
  database,
  files,
}: CustomerInfrastructure): CustomerDependencies => ({
  customers: createD1CustomerRepository(database),
  sites: createD1SiteRepository(database),
  equipments: createD1EquipmentRepository(database),
  photos: createD1PhotoRepository(database),
  photoStorage: createR2PhotoStorage(files),
  organizationTrades: createD1OrganizationTrades(database),
  now: () => new Date(),
});
