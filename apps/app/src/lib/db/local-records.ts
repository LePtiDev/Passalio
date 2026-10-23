import {
  BUILDING_TYPES,
  CIVILITIES,
  CUSTOMER_KINDS,
  customerMutation,
  ENERGIES,
  EQUIPMENT_KINDS,
  EQUIPMENT_PHOTO_KINDS,
  EQUIPMENT_STATUSES,
} from "@passalio/shared";
import * as z from "zod";

const nullableText = z.string().nullable();

const synced = {
  id: z.string(),
  organizationId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
};

export const customerRecord = z.object({
  ...synced,
  kind: z.enum(CUSTOMER_KINDS),
  civility: z.enum(CIVILITIES).nullable(),
  firstName: nullableText,
  lastName: nullableText,
  companyName: nullableText,
  searchName: z.string(),
  email: nullableText,
  phone: nullableText,
  secondaryPhone: nullableText,
  billingAddress: nullableText,
  billingPostalCode: nullableText,
  billingCity: nullableText,
  notes: nullableText,
  remindersOptedOutAt: nullableText,
  createdByUserId: z.string(),
});

export const siteRecord = z.object({
  ...synced,
  customerId: z.string(),
  label: nullableText,
  address: z.string(),
  addressDetails: nullableText,
  postalCode: z.string(),
  city: z.string(),
  buildingType: z.enum(BUILDING_TYPES),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  occupantName: nullableText,
  occupantPhone: nullableText,
  accessNotes: nullableText,
});

export const equipmentRecord = z.object({
  ...synced,
  siteId: z.string(),
  kind: z.enum(EQUIPMENT_KINDS),
  energy: z.enum(ENERGIES).nullable(),
  brand: nullableText,
  model: nullableText,
  serialNumber: nullableText,
  powerKw: z.number().nullable(),
  room: nullableText,
  details: z.record(z.string(), z.unknown()),
  status: z.enum(EQUIPMENT_STATUSES),
  isInstalledByUs: z.boolean(),
  commissionedOn: nullableText,
  installationYear: z.number().nullable(),
  removedOn: nullableText,
  replacedByEquipmentId: nullableText,
  lastSweepingOn: nullableText,
  lastServiceOn: nullableText,
  nextDueDate: nullableText,
  notes: nullableText,
});

export const photoRecord = z.object({
  ...synced,
  equipmentId: z.string(),
  kind: z.enum(EQUIPMENT_PHOTO_KINDS),
  contentType: z.string(),
  takenAt: z.string(),
  createdByUserId: z.string(),
});

export type CustomerRecord = z.infer<typeof customerRecord>;
export type SiteRecord = z.infer<typeof siteRecord>;
export type EquipmentRecord = z.infer<typeof equipmentRecord>;
export type PhotoRecord = z.infer<typeof photoRecord>;

export const outboxEntry = z.object({
  seq: z.number().optional(),
  id: z.string(),
  mutation: customerMutation,
  entityIds: z.array(z.string()),
  createdAt: z.string(),
});

export type OutboxEntry = z.infer<typeof outboxEntry>;

export type PendingPhoto = {
  readonly id: string;
  readonly equipmentId: string;
  readonly kind: PhotoRecord["kind"];
  readonly takenAt: string;
  readonly blob: Blob;
};

export type SyncRejection = {
  readonly id: string;
  readonly description: string;
  readonly error: string;
  readonly at: string;
};

export type SyncStateEntry = {
  readonly key: "cursor" | "lastSyncedAt";
  readonly value: string;
};
