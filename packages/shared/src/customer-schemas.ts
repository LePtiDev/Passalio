import {
  BUILDING_TYPES,
  CALENDAR_DATE_PATTERN,
  CIVILITIES,
  CUSTOMER_KINDS,
  ENERGIES,
  EQUIPMENT_KINDS,
} from "./customers";

import * as z from "zod";

const SHORT_TEXT_MAX_LENGTH = 120;
const ADDRESS_MAX_LENGTH = 200;
const NOTES_MAX_LENGTH = 2000;

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();

const requiredText = (maxLength: number) => z.string().trim().min(1).max(maxLength);

const phone = z
  .string()
  .trim()
  .regex(/^(\+?[\d][\d .-]{5,24})?$/)
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

const email = z
  .union([z.literal(""), z.email().max(254)])
  .transform((value) => (value === "" ? null : value.toLowerCase()))
  .nullable()
  .optional();

const calendarDate = z.string().regex(CALENDAR_DATE_PATTERN).nullable().optional();

export const customerFields = z.object({
  kind: z.enum(CUSTOMER_KINDS),
  civility: z.enum(CIVILITIES).nullable().optional(),
  firstName: optionalText(SHORT_TEXT_MAX_LENGTH),
  lastName: optionalText(SHORT_TEXT_MAX_LENGTH),
  companyName: optionalText(SHORT_TEXT_MAX_LENGTH),
  email,
  phone,
  secondaryPhone: phone,
  billingAddress: optionalText(ADDRESS_MAX_LENGTH),
  billingPostalCode: optionalText(10),
  billingCity: optionalText(SHORT_TEXT_MAX_LENGTH),
  notes: optionalText(NOTES_MAX_LENGTH),
  hasOptedOutOfReminders: z.boolean().optional(),
});

export const customerChanges = customerFields.partial();

export const siteFields = z.object({
  label: optionalText(SHORT_TEXT_MAX_LENGTH),
  address: requiredText(ADDRESS_MAX_LENGTH),
  addressDetails: optionalText(ADDRESS_MAX_LENGTH),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/),
  city: requiredText(SHORT_TEXT_MAX_LENGTH),
  buildingType: z.enum(BUILDING_TYPES),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  occupantName: optionalText(SHORT_TEXT_MAX_LENGTH),
  occupantPhone: phone,
  accessNotes: optionalText(NOTES_MAX_LENGTH),
});

export const siteChanges = siteFields.partial();

export const equipmentFields = z.object({
  kind: z.enum(EQUIPMENT_KINDS),
  energy: z.enum(ENERGIES).nullable().optional(),
  brand: optionalText(SHORT_TEXT_MAX_LENGTH),
  model: optionalText(SHORT_TEXT_MAX_LENGTH),
  serialNumber: optionalText(SHORT_TEXT_MAX_LENGTH),
  powerKw: z.number().positive().max(2000).nullable().optional(),
  room: optionalText(SHORT_TEXT_MAX_LENGTH),
  details: z.record(z.string(), z.unknown()).optional(),
  isInstalledByUs: z.boolean().optional(),
  commissionedOn: calendarDate,
  installationYear: z.int().min(1900).max(2100).nullable().optional(),
  lastSweepingOn: calendarDate,
  lastServiceOn: calendarDate,
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const equipmentChanges = equipmentFields.partial();

export type CustomerFields = z.infer<typeof customerFields>;
export type CustomerChanges = z.infer<typeof customerChanges>;
export type SiteFields = z.infer<typeof siteFields>;
export type SiteChanges = z.infer<typeof siteChanges>;
export type EquipmentFields = z.infer<typeof equipmentFields>;
export type EquipmentChanges = z.infer<typeof equipmentChanges>;
