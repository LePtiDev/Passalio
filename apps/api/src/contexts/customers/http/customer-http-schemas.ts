import { CALENDAR_DATE_PATTERN, EQUIPMENT_PHOTO_KINDS } from "@passalio/shared";
import * as z from "zod";
import {
  customerChanges,
  customerFields,
  equipmentChanges,
  equipmentFields,
  siteChanges,
  siteFields,
} from "../domain/customer-schemas";

const clientId = z.uuid().optional();

export const customerParams = z.object({ customerId: z.uuid() });
export const siteParams = z.object({ siteId: z.uuid() });
export const equipmentParams = z.object({ equipmentId: z.uuid() });
export const photoParams = z.object({ photoId: z.uuid() });

export const listCustomersQuery = z.object({
  q: z.string().trim().max(120).optional(),
  cursor: z.string().max(300).optional(),
});

export const createCustomerBody = z.object({
  id: clientId,
  customer: customerFields,
  site: siteFields.extend({ id: clientId }).optional(),
});

export const updateCustomerBody = customerChanges;

export const addSiteBody = siteFields.extend({ id: clientId });

export const updateSiteBody = siteChanges;

export const addEquipmentBody = equipmentFields.extend({
  id: clientId,
  replacesEquipmentId: z.uuid().optional(),
});

export const updateEquipmentBody = equipmentChanges;

export const removeEquipmentBody = z.object({
  removedOn: z.string().regex(CALENDAR_DATE_PATTERN).optional(),
});

export const uploadPhotoQuery = z.object({
  id: clientId,
  kind: z.enum(EQUIPMENT_PHOTO_KINDS),
  takenAt: z.iso.datetime({ offset: true }).optional(),
});
