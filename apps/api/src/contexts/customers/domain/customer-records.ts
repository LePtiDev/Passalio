import { err, ok, type Result } from "@passalio/shared";
import type { CustomerError } from "./customer-error";
import type { Customer, Site } from "./customer-models";
import { checkCustomerName, searchNameOf } from "./customer-rules";
import { withChanges, type Changes } from "./record-changes";
import type { CustomerChanges, CustomerFields, SiteFields } from "./customer-schemas";

export type RecordContext = {
  readonly id: string;
  readonly organizationId: string;
  readonly at: Date;
};

const optedOutAt = (hasOptedOut: boolean | undefined, current: Date | null, at: Date) => {
  if (hasOptedOut === undefined) {
    return current;
  }
  return hasOptedOut ? (current ?? at) : null;
};

export const newCustomer = (
  fields: CustomerFields,
  context: RecordContext & { readonly createdByUserId: string },
): Result<Customer, CustomerError> => {
  const named = {
    kind: fields.kind,
    firstName: fields.firstName ?? null,
    lastName: fields.lastName ?? null,
    companyName: fields.companyName ?? null,
  };
  const checked = checkCustomerName(named);
  if (!checked.isOk) {
    return checked;
  }
  return ok({
    ...named,
    id: context.id,
    organizationId: context.organizationId,
    civility: fields.civility ?? null,
    searchName: searchNameOf(named),
    email: fields.email ?? null,
    phone: fields.phone ?? null,
    secondaryPhone: fields.secondaryPhone ?? null,
    billingAddress: fields.billingAddress ?? null,
    billingPostalCode: fields.billingPostalCode ?? null,
    billingCity: fields.billingCity ?? null,
    notes: fields.notes ?? null,
    remindersOptedOutAt: optedOutAt(fields.hasOptedOutOfReminders, null, context.at),
    createdByUserId: context.createdByUserId,
    createdAt: context.at,
    updatedAt: context.at,
  });
};

export const customerUpdates = (
  current: Customer,
  changes: CustomerChanges,
  at: Date,
): Result<Changes<Customer>, CustomerError> => {
  const { hasOptedOutOfReminders, ...fields } = changes;
  const merged = withChanges(current, fields);
  if (!checkCustomerName(merged).isOk) {
    return err("customer_name_required");
  }
  return ok({
    ...fields,
    searchName: searchNameOf(merged),
    remindersOptedOutAt: optedOutAt(hasOptedOutOfReminders, current.remindersOptedOutAt, at),
    updatedAt: at,
  });
};

export const newSite = (
  fields: SiteFields,
  context: RecordContext & { readonly customerId: string },
): Site => ({
  id: context.id,
  organizationId: context.organizationId,
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
  createdAt: context.at,
  updatedAt: context.at,
});
