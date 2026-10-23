import type { ChangesAfter } from "@passalio/shared";
import type { TradeId } from "@passalio/trades";
import type { Customer, CustomerSummary, Equipment, EquipmentPhoto, Site } from "./customer-models";
import type { Changes } from "./record-changes";

export type CustomerPage = {
  readonly limit: number;
  readonly after?: { readonly searchName: string; readonly id: string };
  readonly range?: { readonly from: string; readonly to: string };
};

type RecordChanges<T> = Changes<Omit<T, "id" | "organizationId" | "createdAt">>;

export type CustomerRepository = {
  readonly exists: (id: string) => Promise<boolean>;
  readonly create: (customer: Customer, site: Site | undefined) => Promise<void>;
  readonly findById: (organizationId: string, customerId: string) => Promise<Customer | undefined>;
  readonly update: (
    organizationId: string,
    customerId: string,
    changes: RecordChanges<Customer>,
  ) => Promise<void>;
  readonly archive: (organizationId: string, customerId: string, at: Date) => Promise<void>;
  readonly list: (
    organizationId: string,
    page: CustomerPage,
  ) => Promise<readonly (CustomerSummary & { readonly searchName: string })[]>;
};

export type SiteRepository = {
  readonly exists: (id: string) => Promise<boolean>;
  readonly create: (site: Site) => Promise<void>;
  readonly findById: (organizationId: string, siteId: string) => Promise<Site | undefined>;
  readonly update: (
    organizationId: string,
    siteId: string,
    changes: RecordChanges<Site>,
  ) => Promise<void>;
  readonly listByCustomer: (organizationId: string, customerId: string) => Promise<readonly Site[]>;
};

export type EquipmentReplacement = {
  readonly replaced: Equipment;
  readonly removedOn: string;
};

export type EquipmentRepository = {
  readonly exists: (id: string) => Promise<boolean>;
  readonly create: (equipment: Equipment, replacement?: EquipmentReplacement) => Promise<void>;
  readonly findById: (
    organizationId: string,
    equipmentId: string,
  ) => Promise<Equipment | undefined>;
  readonly update: (
    organizationId: string,
    equipmentId: string,
    changes: RecordChanges<Equipment>,
  ) => Promise<void>;
  readonly listBySites: (
    organizationId: string,
    siteIds: readonly string[],
  ) => Promise<readonly Equipment[]>;
};

export type PhotoRepository = {
  readonly exists: (id: string) => Promise<boolean>;
  readonly create: (photo: EquipmentPhoto) => Promise<void>;
  readonly findById: (
    organizationId: string,
    photoId: string,
  ) => Promise<EquipmentPhoto | undefined>;
  readonly listByEquipments: (
    organizationId: string,
    equipmentIds: readonly string[],
  ) => Promise<readonly EquipmentPhoto[]>;
};

export type StoredPhoto = {
  readonly body: ReadableStream;
  readonly contentType: string;
};

export type PhotoStorage = {
  readonly put: (key: string, body: ArrayBuffer, contentType: string) => Promise<void>;
  readonly get: (key: string) => Promise<StoredPhoto | undefined>;
};

export type OrganizationTrades = {
  readonly of: (organizationId: string) => Promise<readonly TradeId[]>;
};

export type { ChangeCursor, Tombstoned } from "@passalio/shared";

export type ChangeFeed = {
  readonly customers: ChangesAfter<Customer>;
  readonly sites: ChangesAfter<Site>;
  readonly equipments: ChangesAfter<Equipment>;
  readonly photos: ChangesAfter<EquipmentPhoto>;
};

export type CustomerDependencies = {
  readonly customers: CustomerRepository;
  readonly sites: SiteRepository;
  readonly equipments: EquipmentRepository;
  readonly photos: PhotoRepository;
  readonly photoStorage: PhotoStorage;
  readonly organizationTrades: OrganizationTrades;
  readonly changes: ChangeFeed;
  readonly now: () => Date;
};
