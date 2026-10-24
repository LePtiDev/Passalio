import * as z from "zod";
import { TRADE_IDS, type TradeId } from "./trade-ids";
import {
  DEFAULT_VISIT_MINUTES,
  MAX_VISIT_DURATION_MINUTES,
  visitDurationMinutes,
} from "./visit-durations";

export const SERVICE_DOCUMENTS = [
  "chimney_sweeping_certificate",
  "maintenance_certificate",
  "none",
] as const;

export type ServiceDocument = (typeof SERVICE_DOCUMENTS)[number];

export const DAY_MINUTES = 24 * 60;

export const MAX_SERVICE_DAYS = 10;

export const SERVICE_NAME_MAX_LENGTH = 80;

export const MAX_SERVICE_PRICE_CENTS = 10_000_000;

export const isDayDuration = (minutes: number) => minutes >= DAY_MINUTES;

export const daysOf = (minutes: number) => minutes / DAY_MINUTES;

export const serviceDurationMinutes = z.union([
  visitDurationMinutes,
  z
    .int()
    .min(DAY_MINUTES)
    .max(MAX_SERVICE_DAYS * DAY_MINUTES)
    .multipleOf(DAY_MINUTES),
]);

export const servicePriceCents = z.int().min(0).max(MAX_SERVICE_PRICE_CENTS).nullable();

export const serviceFields = z.object({
  name: z.string().trim().min(1).max(SERVICE_NAME_MAX_LENGTH),
  durationMinutes: serviceDurationMinutes,
  priceCents: servicePriceCents,
  document: z.enum(SERVICE_DOCUMENTS),
  trade: z.enum(TRADE_IDS).nullable(),
});

export const serviceChanges = serviceFields.partial().strict();

export const serviceResponse = serviceFields.extend({ id: z.string() });

export type ServiceFields = z.infer<typeof serviceFields>;
export type ServiceChanges = z.infer<typeof serviceChanges>;
export type ServiceResponse = z.infer<typeof serviceResponse>;

export const DEFAULT_SERVICE_DOCUMENTS: Readonly<Record<TradeId, ServiceDocument>> = {
  chimney_sweeping: "chimney_sweeping_certificate",
  stove_maintenance: "maintenance_certificate",
  boiler_maintenance: "maintenance_certificate",
  heat_pump_maintenance: "maintenance_certificate",
  septic_tank_emptying: "none",
};

export const defaultServiceOf = (trade: TradeId, name: string): ServiceFields => ({
  name,
  durationMinutes: DEFAULT_VISIT_MINUTES[trade],
  priceCents: null,
  document: DEFAULT_SERVICE_DOCUMENTS[trade],
  trade,
});

export const visitMinutesOfService = (durationMinutes: number) =>
  Math.min(durationMinutes, MAX_VISIT_DURATION_MINUTES);
