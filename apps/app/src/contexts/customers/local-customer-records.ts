import {
  searchNameOf,
  type CustomerFields,
  type EquipmentFields,
  type SiteFields,
} from "@passalio/shared";
import type { CustomerRecord, EquipmentRecord, SiteRecord } from "@/lib/db/local-records";

export type LocalActor = {
  readonly userId: string;
  readonly organizationId: string;
};

type RecordContext = {
  readonly id: string;
  readonly organizationId: string;
  readonly at: string;
};

const syncedFields = ({ id, organizationId, at }: RecordContext) => ({
  id,
  organizationId,
  createdAt: at,
  updatedAt: at,
  deletedAt: null,
});

export const localCustomer = (
  fields: CustomerFields,
  context: RecordContext & { readonly createdByUserId: string },
): CustomerRecord => {
  const named = {
    kind: fields.kind,
    firstName: fields.firstName ?? null,
    lastName: fields.lastName ?? null,
    companyName: fields.companyName ?? null,
  };
  return {
    ...syncedFields(context),
    ...named,
    civility: fields.civility ?? null,
    searchName: searchNameOf(named),
    email: fields.email ?? null,
    phone: fields.phone ?? null,
    secondaryPhone: fields.secondaryPhone ?? null,
    billingAddress: fields.billingAddress ?? null,
    billingPostalCode: fields.billingPostalCode ?? null,
    billingCity: fields.billingCity ?? null,
    notes: fields.notes ?? null,
    remindersOptedOutAt: fields.hasOptedOutOfReminders === true ? context.at : null,
    createdByUserId: context.createdByUserId,
  };
};

export const localSite = (
  fields: SiteFields,
  context: RecordContext & { readonly customerId: string },
): SiteRecord => ({
  ...syncedFields(context),
  customerId: context.customerId,
  label: fields.label ?? null,
  address: fields.address,
  addressDetails: fields.addressDetails ?? null,
  postalCode: fields.postalCode,
  city: fields.city,
  buildingType: fields.buildingType,
  latitude: fields.latitude ?? null,
  longitude: fields.longitude ?? null,
  occupantName: fields.occupantName ?? null,
  occupantPhone: fields.occupantPhone ?? null,
  accessNotes: fields.accessNotes ?? null,
});

export const localEquipment = (
  fields: EquipmentFields,
  context: RecordContext & { readonly siteId: string },
): EquipmentRecord => ({
  ...syncedFields(context),
  siteId: context.siteId,
  kind: fields.kind,
  energy: fields.energy ?? null,
  brand: fields.brand ?? null,
  model: fields.model ?? null,
  serialNumber: fields.serialNumber ?? null,
  powerKw: fields.powerKw ?? null,
  room: fields.room ?? null,
  details: fields.details ?? {},
  status: "active",
  isInstalledByUs: fields.isInstalledByUs ?? false,
  commissionedOn: fields.commissionedOn ?? null,
  removedOn: null,
  replacedByEquipmentId: null,
  lastSweepingOn: fields.lastSweepingOn ?? null,
  lastServiceOn: fields.lastServiceOn ?? null,
  nextDueDate: null,
  notes: fields.notes ?? null,
});

export const definedChanges = (changes: object) =>
  Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
