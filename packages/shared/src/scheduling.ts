import * as z from "zod";
import { NOTES_MAX_LENGTH, optionalText, requiredCalendarDate } from "./text-fields";

export const INTERVENTION_STATUSES = ["planned", "completed", "cancelled"] as const;

export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];

export const PAYMENT_METHODS = ["card", "check", "cash", "transfer"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MAX_INTERVENTION_EQUIPMENTS = 20;

export const MAX_VISIT_TYPES = 10;

const MAX_DURATION_MINUTES = 12 * 60;
const MAX_PRICE_CENTS = 10_000_000;

const priceCents = z.int().min(0).max(MAX_PRICE_CENTS).nullable().optional();

export const interventionFields = z.object({
  customerId: z.uuid(),
  siteId: z.uuid(),
  technicianUserId: z.string().min(1).max(64),
  scheduledDate: requiredCalendarDate,
  startTime: z.string().regex(TIME_OF_DAY_PATTERN).nullable().optional(),
  durationMinutes: z.int().min(5).max(MAX_DURATION_MINUTES),
  visitTypes: z.array(z.string().min(1).max(40)).max(MAX_VISIT_TYPES).optional(),
  equipmentIds: z.array(z.uuid()).max(MAX_INTERVENTION_EQUIPMENTS),
  announcedPriceCents: priceCents,
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const interventionChanges = interventionFields
  .omit({ customerId: true, siteId: true })
  .partial();

export const interventionCompletion = z.object({
  completedOn: requiredCalendarDate,
  paymentMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
  paidAmountCents: priceCents,
});

export type InterventionFields = z.infer<typeof interventionFields>;
export type InterventionChanges = z.infer<typeof interventionChanges>;
export type InterventionCompletion = z.infer<typeof interventionCompletion>;

export const schedulingMutation = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_intervention"),
    interventionId: z.uuid(),
    intervention: interventionFields,
  }),
  z.object({
    type: z.literal("update_intervention"),
    interventionId: z.uuid(),
    changes: interventionChanges,
  }),
  z.object({ type: z.literal("cancel_intervention"), interventionId: z.uuid() }),
  z.object({
    type: z.literal("complete_intervention"),
    interventionId: z.uuid(),
    completion: interventionCompletion,
  }),
]);

export type SchedulingMutation = z.infer<typeof schedulingMutation>;
