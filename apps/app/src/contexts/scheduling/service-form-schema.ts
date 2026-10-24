import {
  SERVICE_DOCUMENTS,
  SERVICE_NAME_MAX_LENGTH,
  serviceDurationMinutes,
  type ServiceFields,
} from "@passalio/trades";
import * as z from "zod";
import type { ServiceRecord } from "@/lib/db/local-records";
import { formatEuros, schedulingFr } from "./fr";
import { isPrice, priceCentsOf } from "./visit-form-schema";

const errors = schedulingFr.services.errors;

export const serviceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: errors.name })
    .max(SERVICE_NAME_MAX_LENGTH, { error: errors.name }),
  durationMinutes: serviceDurationMinutes,
  price: z.string().trim().refine(isPrice, { error: errors.price }),
  document: z.enum(SERVICE_DOCUMENTS),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const NEW_SERVICE_FORM: ServiceFormValues = {
  name: "",
  durationMinutes: 60,
  price: "",
  document: "none",
};

export const serviceFormOf = (service: ServiceRecord): ServiceFormValues => ({
  name: service.name,
  durationMinutes: service.durationMinutes,
  price: service.priceCents === null ? "" : formatEuros(service.priceCents),
  document: service.document,
});

export const toServiceFields = (
  values: ServiceFormValues,
  trade: ServiceRecord["trade"],
): ServiceFields => ({
  name: values.name,
  durationMinutes: values.durationMinutes,
  priceCents: priceCentsOf(values.price),
  document: values.document,
  trade,
});
