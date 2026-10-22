import type { TradeId } from "@passalio/trades";
import type { Customer, Equipment, EquipmentPhoto, Site } from "../domain/customer-models";
import type { CustomerDependencies } from "../domain/customer-ports";
import { withChanges, type Changes } from "../domain/record-changes";

export type InMemoryCustomerState = {
  readonly customers: Customer[];
  readonly sites: Site[];
  readonly equipments: Equipment[];
  readonly photos: EquipmentPhoto[];
  readonly archivedIds: Set<string>;
  readonly storedPhotos: Map<string, string>;
  readonly trades: Map<string, readonly TradeId[]>;
};

export const createInMemoryCustomerState = (): InMemoryCustomerState => ({
  customers: [],
  sites: [],
  equipments: [],
  photos: [],
  archivedIds: new Set(),
  storedPhotos: new Map(),
  trades: new Map(),
});

type Row = { readonly id: string; readonly organizationId: string };

const replaceWhere = <T>(items: T[], predicate: (item: T) => boolean, update: (item: T) => T) => {
  items.forEach((item, index) => {
    if (predicate(item)) {
      items[index] = update(item);
    }
  });
};

export const createInMemoryCustomerDependencies = (
  state: InMemoryCustomerState,
  now: () => Date = () => new Date(),
): CustomerDependencies => {
  const isActiveIn =
    (organizationId: string) =>
    ({ id, organizationId: rowOrganizationId }: Row) =>
      rowOrganizationId === organizationId && !state.archivedIds.has(id);
  const findIn = <T extends Row>(items: readonly T[], organizationId: string, id: string) =>
    items.filter(isActiveIn(organizationId)).find((item) => item.id === id);
  const updateIn = <T extends Row>(
    items: T[],
    organizationId: string,
    id: string,
    changes: Changes<T>,
  ) =>
    replaceWhere(
      items,
      (item) => isActiveIn(organizationId)(item) && item.id === id,
      (item) => withChanges(item, changes),
    );

  return {
    customers: {
      exists: async (id) => state.customers.some((customer) => customer.id === id),
      create: async (customer, site) => {
        state.customers.push(customer);
        if (site !== undefined) {
          state.sites.push(site);
        }
      },
      findById: async (organizationId, customerId) =>
        findIn(state.customers, organizationId, customerId),
      update: async (organizationId, customerId, changes) =>
        updateIn<Customer>(state.customers, organizationId, customerId, changes),
      archive: async (organizationId, customerId) => {
        const siteIds = state.sites
          .filter(
            (site) => site.organizationId === organizationId && site.customerId === customerId,
          )
          .map(({ id }) => id);
        const equipmentIds = state.equipments
          .filter((equipment) => siteIds.includes(equipment.siteId))
          .map(({ id }) => id);
        const photoIds = state.photos
          .filter((photo) => equipmentIds.includes(photo.equipmentId))
          .map(({ id }) => id);
        [customerId, ...siteIds, ...equipmentIds, ...photoIds].forEach((id) =>
          state.archivedIds.add(id),
        );
      },
      list: async (organizationId, { limit, after, range }) =>
        state.customers
          .filter(isActiveIn(organizationId))
          .filter(
            ({ searchName }) =>
              range === undefined || (searchName >= range.from && searchName < range.to),
          )
          .filter(
            ({ searchName, id }) =>
              after === undefined ||
              searchName > after.searchName ||
              (searchName === after.searchName && id > after.id),
          )
          .toSorted(
            (left, right) =>
              left.searchName.localeCompare(right.searchName) || left.id.localeCompare(right.id),
          )
          .slice(0, limit)
          .map(
            ({
              id,
              kind,
              firstName,
              lastName,
              companyName,
              phone,
              email,
              updatedAt,
              searchName,
            }) => ({
              id,
              kind,
              firstName,
              lastName,
              companyName,
              phone,
              email,
              updatedAt,
              searchName,
            }),
          ),
    },
    sites: {
      exists: async (id) => state.sites.some((site) => site.id === id),
      create: async (site) => {
        state.sites.push(site);
      },
      findById: async (organizationId, siteId) => findIn(state.sites, organizationId, siteId),
      update: async (organizationId, siteId, changes) =>
        updateIn<Site>(state.sites, organizationId, siteId, changes),
      listByCustomer: async (organizationId, customerId) =>
        state.sites
          .filter(isActiveIn(organizationId))
          .filter((site) => site.customerId === customerId),
    },
    equipments: {
      exists: async (id) => state.equipments.some((equipment) => equipment.id === id),
      create: async (equipment, replacement) => {
        state.equipments.push(equipment);
        if (replacement !== undefined) {
          updateIn<Equipment>(state.equipments, equipment.organizationId, replacement.replaced.id, {
            status: "removed",
            removedOn: replacement.removedOn,
            replacedByEquipmentId: equipment.id,
            updatedAt: equipment.updatedAt,
          });
        }
      },
      findById: async (organizationId, equipmentId) =>
        findIn(state.equipments, organizationId, equipmentId),
      update: async (organizationId, equipmentId, changes) =>
        updateIn<Equipment>(state.equipments, organizationId, equipmentId, changes),
      listBySites: async (organizationId, siteIds) =>
        state.equipments
          .filter(isActiveIn(organizationId))
          .filter((equipment) => siteIds.includes(equipment.siteId)),
    },
    photos: {
      exists: async (id) => state.photos.some((photo) => photo.id === id),
      create: async (photo) => {
        state.photos.push(photo);
      },
      findById: async (organizationId, photoId) => findIn(state.photos, organizationId, photoId),
      listByEquipments: async (organizationId, equipmentIds) =>
        state.photos
          .filter(isActiveIn(organizationId))
          .filter((photo) => equipmentIds.includes(photo.equipmentId)),
    },
    photoStorage: {
      put: async (key, _body, contentType) => {
        state.storedPhotos.set(key, contentType);
      },
      get: async (key) => {
        const contentType = state.storedPhotos.get(key);
        return contentType === undefined ? undefined : { body: new Blob([]).stream(), contentType };
      },
    },
    organizationTrades: {
      of: async (organizationId) => state.trades.get(organizationId) ?? [],
    },
    now,
  };
};
