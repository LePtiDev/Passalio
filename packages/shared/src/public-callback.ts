import * as z from "zod";

export const CALLBACK_SLOTS = ["morning", "noon", "afternoon", "evening"] as const;

export type CallbackSlot = (typeof CALLBACK_SLOTS)[number];

export const CALLBACK_MESSAGE_MAX_LENGTH = 1000;

export const FRENCH_PHONE_PATTERN = /^0[1-9]\d{8}$/;

export const FRENCH_POSTAL_CODE_PATTERN = /^\d{5}$/;

const PAGE_PATH_PATTERN = /^\/[a-z0-9\-/]*$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((value) => (value === null || value === "" ? null : value));

export const publicCallbackRequest = z.object({
  firstName: z.string().trim().min(1).max(80),
  company: optionalText(120),
  phone: z.string().regex(FRENCH_PHONE_PATTERN),
  postalCode: z.string().regex(FRENCH_POSTAL_CODE_PATTERN),
  slot: z.enum(CALLBACK_SLOTS),
  message: optionalText(CALLBACK_MESSAGE_MAX_LENGTH),
  pagePath: z.string().max(200).regex(PAGE_PATH_PATTERN),
  turnstileToken: z.string().min(1).max(2048),
});

export type PublicCallbackRequest = z.infer<typeof publicCallbackRequest>;

export const publicCallbackResponse = z.object({ status: z.literal("received") });

export type PublicCallbackResponse = z.infer<typeof publicCallbackResponse>;
