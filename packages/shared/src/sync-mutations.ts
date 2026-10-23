import * as z from "zod";
import { complianceMutation, type ComplianceMutation } from "./compliance";
import { customerMutation, type CustomerMutation } from "./customer-mutations";
import { schedulingMutation, type SchedulingMutation } from "./scheduling";

export const SYNC_PUSH_MAX_MUTATIONS = 50;

export const syncMutation = z.discriminatedUnion("type", [
  ...customerMutation.options,
  ...schedulingMutation.options,
  ...complianceMutation.options,
]);

export type SyncMutation = z.infer<typeof syncMutation>;

const typesOf = (options: readonly { readonly shape: { readonly type: z.ZodLiteral<string> } }[]) =>
  new Set(options.flatMap((option) => [...option.shape.type.values]));

const CUSTOMER_TYPES = typesOf(customerMutation.options);
const SCHEDULING_TYPES = typesOf(schedulingMutation.options);

export const isCustomerMutation = (mutation: SyncMutation): mutation is CustomerMutation =>
  CUSTOMER_TYPES.has(mutation.type);

export const isSchedulingMutation = (mutation: SyncMutation): mutation is SchedulingMutation =>
  SCHEDULING_TYPES.has(mutation.type);

export const isComplianceMutation = (mutation: SyncMutation): mutation is ComplianceMutation =>
  !isCustomerMutation(mutation) && !isSchedulingMutation(mutation);

export const syncPushBody = z.object({
  mutations: z
    .array(z.object({ id: z.uuid(), mutation: syncMutation }))
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
