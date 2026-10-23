import * as z from "zod";
import { CALENDAR_DATE_PATTERN } from "./customers";

export const SHORT_TEXT_MAX_LENGTH = 120;
export const ADDRESS_MAX_LENGTH = 200;
export const NOTES_MAX_LENGTH = 2000;

export const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();

export const requiredText = (maxLength: number) => z.string().trim().min(1).max(maxLength);

export const phone = z
  .string()
  .trim()
  .regex(/^(\+?[\d][\d .-]{5,24})?$/)
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

export const email = z
  .union([z.literal(""), z.email().max(254)])
  .transform((value) => (value === "" ? null : value.toLowerCase()))
  .nullable()
  .optional();

export const requiredCalendarDate = z.string().regex(CALENDAR_DATE_PATTERN);

export const calendarDate = requiredCalendarDate.nullable().optional();
