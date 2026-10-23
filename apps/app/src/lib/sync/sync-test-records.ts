import type { CustomerRecord, EquipmentRecord, PhotoRecord, SiteRecord } from "../db/local-records";

const ORGANIZATION_ID = "organization-a";
const AT = "2026-10-22T10:00:00.000Z";

const synced = (id: string, deletedAt: string | null) => ({
  id,
  organizationId: ORGANIZATION_ID,
  createdAt: AT,
  updatedAt: deletedAt ?? AT,
  deletedAt,
});

export const serverCustomerRecord = (
  id: string,
  lastName: string,
  deletedAt: string | null = null,
): CustomerRecord => ({
  ...synced(id, deletedAt),
  kind: "individual",
  civility: null,
  firstName: null,
  lastName,
  companyName: null,
  searchName: lastName.toLowerCase(),
  email: null,
  phone: null,
  secondaryPhone: null,
  billingAddress: null,
  billingPostalCode: null,
  billingCity: null,
  notes: null,
  remindersOptedOutAt: null,
  createdByUserId: "user-2",
});

export const serverSiteRecord = (
  id: string,
  customerId: string,
  deletedAt: string | null = null,
): SiteRecord => ({
  ...synced(id, deletedAt),
  customerId,
  label: null,
  address: "1 rue A",
  addressDetails: null,
  postalCode: "94200",
  city: "Ivry-sur-Seine",
  buildingType: "house",
  latitude: null,
  longitude: null,
  occupantName: null,
  occupantPhone: null,
  accessNotes: null,
});

export const serverEquipmentRecord = (
  id: string,
  siteId: string,
  deletedAt: string | null = null,
): EquipmentRecord => ({
  ...synced(id, deletedAt),
  siteId,
  kind: "boiler",
  energy: null,
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
});

export const serverPhotoRecord = (
  id: string,
  equipmentId: string,
  deletedAt: string | null = null,
): PhotoRecord => ({
  ...synced(id, deletedAt),
  equipmentId,
  kind: "plate",
  contentType: "image/jpeg",
  takenAt: AT,
  createdByUserId: "user-2",
});
