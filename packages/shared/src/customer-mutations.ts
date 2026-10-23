import * as z from "zod";
import { CALENDAR_DATE_PATTERN } from "./customers";
import {
  customerChanges,
  customerFields,
  equipmentChanges,
  equipmentFields,
  siteChanges,
  siteFields,
} from "./customer-schemas";

export const SYNC_PUSH_MAX_MUTATIONS = 50;

export const customerMutation = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create_customer"), customerId: z.uuid(), customer: customerFields }),
  z.object({ type: z.literal("update_customer"), customerId: z.uuid(), changes: customerChanges }),
  z.object({ type: z.literal("archive_customer"), customerId: z.uuid() }),
  z.object({
    type: z.literal("add_site"),
    siteId: z.uuid(),
    customerId: z.uuid(),
    site: siteFields,
  }),
  z.object({ type: z.literal("update_site"), siteId: z.uuid(), changes: siteChanges }),
  z.object({
    type: z.literal("add_equipment"),
    equipmentId: z.uuid(),
    siteId: z.uuid(),
    replacesEquipmentId: z.uuid().optional(),
    equipment: equipmentFields,
  }),
  z.object({
    type: z.literal("update_equipment"),
    equipmentId: z.uuid(),
    changes: equipmentChanges,
  }),
  z.object({
    type: z.literal("remove_equipment"),
    equipmentId: z.uuid(),
    removedOn: z.string().regex(CALENDAR_DATE_PATTERN).optional(),
  }),
]);

export type CustomerMutation = z.infer<typeof customerMutation>;

export const syncPushBody = z.object({
  mutations: z
    .array(z.object({ id: z.uuid(), mutation: customerMutation }))
    .min(1)
    .max(SYNC_PUSH_MAX_MUTATIONS),
});

export type SyncPushBody = z.infer<typeof syncPushBody>;

export const syncPushResult = z.object({
  id: z.string(),
  status: z.enum(["applied", "rejected"]),
  error: z.string().optional(),
});

export type SyncPushResult = z.infer<typeof syncPushResult>;
