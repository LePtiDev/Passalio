import type { Customer, Equipment, EquipmentPhoto, Site } from "../domain/customer-models";
import type { InMemoryCustomerState } from "./in-memory-customer-dependencies";

const CREATED_AT = new Date("2026-01-01T00:00:00Z");

type Owned = { readonly id: string; readonly organizationId: string };

export const inMemoryCustomer = (
  customer: Owned & Partial<Customer> & { readonly lastName: string },
): Customer => ({
  kind: "individual",
  civility: null,
  firstName: null,
  companyName: null,
  searchName: customer.lastName.toLowerCase(),
  email: null,
  phone: null,
  secondaryPhone: null,
  billingAddress: null,
  billingPostalCode: null,
  billingCity: null,
  notes: null,
  remindersOptedOutAt: null,
  createdByUserId: "user-owner",
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...customer,
});

export const inMemorySite = (site: Owned & Pick<Site, "customerId"> & Partial<Site>): Site => ({
  label: null,
  address: "12 rue Paul Bert",
  addressDetails: null,
  postalCode: "94200",
  city: "Ivry-sur-Seine",
  buildingType: "house",
  latitude: null,
  longitude: null,
  occupantName: null,
  occupantPhone: null,
  accessNotes: null,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...site,
});

export const inMemoryEquipment = (
  equipment: Owned & Pick<Equipment, "siteId"> & Partial<Equipment>,
): Equipment => ({
  kind: "boiler",
  energy: "gas",
  brand: null,
  model: null,
  serialNumber: null,
  powerKw: null,
  room: null,
  details: {},
  status: "active",
  isInstalledByUs: false,
  commissionedOn: null,
  installationYear: null,
  removedOn: null,
  replacedByEquipmentId: null,
  lastSweepingOn: null,
  lastServiceOn: null,
  nextDueDate: null,
  notes: null,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...equipment,
});

export const inMemoryPhoto = (
  photo: Owned & Pick<EquipmentPhoto, "equipmentId"> & Partial<EquipmentPhoto>,
): EquipmentPhoto => ({
  kind: "plate",
  storageKey: `organizations/${photo.organizationId}/equipment-photos/${photo.id}`,
  contentType: "image/jpeg",
  takenAt: CREATED_AT,
  createdByUserId: "user-owner",
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...photo,
});

export const seedCustomerOf = (
  state: InMemoryCustomerState,
  organizationId: string,
  suffix: string,
) => {
  const customer = inMemoryCustomer({
    id: `customer-${suffix}`,
    organizationId,
    lastName: `Lefèvre ${suffix}`,
  });
  const site = inMemorySite({ id: `site-${suffix}`, organizationId, customerId: customer.id });
  const equipment = inMemoryEquipment({
    id: `equipment-${suffix}`,
    organizationId,
    siteId: site.id,
  });
  const photo = inMemoryPhoto({ id: `photo-${suffix}`, organizationId, equipmentId: equipment.id });
  state.customers.push(customer);
  state.sites.push(site);
  state.equipments.push(equipment);
  state.photos.push(photo);
  state.storedPhotos.set(photo.storageKey, photo.contentType);
  state.trades.set(organizationId, ["chimney_sweeping", "boiler_maintenance"]);
  return { customer, site, equipment, photo };
};
