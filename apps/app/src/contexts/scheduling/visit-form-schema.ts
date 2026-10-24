import { TIME_OF_DAY_PATTERN, type InterventionFields } from "@passalio/shared";
import { TRADE_IDS, visitDurationMinutes } from "@passalio/trades";
import * as z from "zod";
import { schedulingFr } from "./fr";

const errors = schedulingFr.form.errors;

export const DEFAULT_DURATION_MINUTES = 60;

const MAX_PRICE_EUROS = 100_000;

const PRICE_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

const priceTextOf = (value: string) => value.replaceAll(/[\s€]/g, "");

export const priceCentsOf = (value: string): number | null => {
  const text = priceTextOf(value);
  if (text === "") {
    return null;
  }
  return Math.round(Number(text.replace(",", ".")) * 100);
};

const isPrice = (value: string) => {
  const text = priceTextOf(value);
  return (
    text === "" || (PRICE_PATTERN.test(text) && Number(text.replace(",", ".")) <= MAX_PRICE_EUROS)
  );
};

export const visitFormSchema = z.object({
  customerId: z.string().min(1, { error: errors.customer }),
  siteId: z.string().min(1, { error: errors.site }),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: errors.date }),
  startTime: z.string().regex(TIME_OF_DAY_PATTERN, { error: errors.time }),
  technicianUserId: z.string().min(1, { error: errors.technician }),
  visitTypes: z.array(z.enum(TRADE_IDS)).min(1, { error: errors.visitType }).optional(),
  durationMinutes: visitDurationMinutes.optional(),
  equipmentIds: z.array(z.string()),
  price: z.string().trim().refine(isPrice, { error: errors.price }),
  notes: z.string().trim().max(2000),
});

export type VisitFormValues = z.infer<typeof visitFormSchema>;

export const emptyVisitForm = (defaults: {
  readonly customerId: string;
  readonly scheduledDate: string;
  readonly technicianUserId: string;
}): VisitFormValues => ({
  ...defaults,
  siteId: "",
  startTime: "",
  equipmentIds: [],
  price: "",
  notes: "",
});

export const toInterventionFields = (values: VisitFormValues): InterventionFields => ({
  customerId: values.customerId,
  siteId: values.siteId,
  technicianUserId: values.technicianUserId,
  scheduledDate: values.scheduledDate,
  startTime: values.startTime,
  durationMinutes: values.durationMinutes ?? DEFAULT_DURATION_MINUTES,
  visitTypes: values.visitTypes ?? [],
  equipmentIds: values.equipmentIds,
  announcedPriceCents: priceCentsOf(values.price),
  notes: values.notes === "" ? null : values.notes,
});
