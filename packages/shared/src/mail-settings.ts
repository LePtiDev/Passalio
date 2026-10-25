import * as z from "zod";
import { NOTIFY_MODES } from "./prospect-calls";
import { NOTES_MAX_LENGTH, SHORT_TEXT_MAX_LENGTH } from "./text-fields";

export const MAIL_PROVIDERS = ["zoho", "ovh_email_pro", "ovh_mx_plan", "google", "other"] as const;

export type MailProvider = (typeof MAIL_PROVIDERS)[number];

export const SMTP_SECURITIES = ["ssl", "starttls"] as const;

export type SmtpSecurity = (typeof SMTP_SECURITIES)[number];

export const SMTP_PORTS = [465, 587] as const;

export type SmtpPort = (typeof SMTP_PORTS)[number];

export const SECURITY_OF_PORT: Readonly<Record<SmtpPort, SmtpSecurity>> = {
  465: "ssl",
  587: "starttls",
};

export type SmtpPreset = { readonly host: string; readonly port: SmtpPort };

export const MAIL_PROVIDER_PRESETS: Readonly<Record<Exclude<MailProvider, "other">, SmtpPreset>> = {
  zoho: { host: "smtp.zoho.eu", port: 465 },
  ovh_email_pro: { host: "pro1.mail.ovh.net", port: 587 },
  ovh_mx_plan: { host: "ssl0.ovh.net", port: 465 },
  google: { host: "smtp.gmail.com", port: 465 },
};

export const SMTP_PASSWORD_MAX_LENGTH = 200;

export const MAIL_SIGNATURE_MAX_LENGTH = NOTES_MAX_LENGTH;

const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

const address = z.email().max(254).toLowerCase();

const nullableAddress = z
  .union([z.literal(""), address])
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const mailSettingsChange = z.object({
  senderName: z.string().trim().min(1).max(SHORT_TEXT_MAX_LENGTH),
  senderAddress: address,
  replyTo: nullableAddress,
  provider: z.enum(MAIL_PROVIDERS),
  smtpHost: z.string().trim().toLowerCase().max(253).regex(HOST_PATTERN),
  smtpPort: z.union([z.literal(465), z.literal(587)]),
  smtpUsername: z.string().trim().min(1).max(254),
  smtpPassword: z.string().min(1).max(SMTP_PASSWORD_MAX_LENGTH).optional(),
  signature: z
    .string()
    .trim()
    .max(MAIL_SIGNATURE_MAX_LENGTH)
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  reminderNotify: z.enum(NOTIFY_MODES),
  reminderAddress: nullableAddress,
});

export type MailSettingsChange = z.infer<typeof mailSettingsChange>;

export const mailSettingsResponse = z.object({
  userId: z.string(),
  member: z.object({ name: z.string(), email: z.string() }),
  settings: z
    .object({
      senderName: z.string(),
      senderAddress: z.string(),
      replyTo: z.string().nullable(),
      provider: z.enum(MAIL_PROVIDERS),
      smtpHost: z.string(),
      smtpPort: z.union([z.literal(465), z.literal(587)]),
      smtpUsername: z.string(),
      hasPassword: z.boolean(),
      passwordUpdatedAt: z.iso.datetime().nullable(),
      verifiedAt: z.iso.datetime().nullable(),
      signature: z.string().nullable(),
      reminderNotify: z.enum(NOTIFY_MODES),
      reminderAddress: z.string().nullable(),
      updatedAt: z.iso.datetime(),
      updatedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
    })
    .nullable(),
});

export type MailSettingsResponse = z.infer<typeof mailSettingsResponse>;

export const mailboxTestResponse = z.object({
  sentTo: z.string(),
  verifiedAt: z.iso.datetime(),
});

export type MailboxTestResponse = z.infer<typeof mailboxTestResponse>;
