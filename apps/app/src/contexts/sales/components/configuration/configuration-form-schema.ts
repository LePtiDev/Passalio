import {
  MAIL_PROVIDER_PRESETS,
  MAIL_PROVIDERS,
  MAIL_SENDER_NAME_MAX_LENGTH,
  MAIL_SIGNATURE_MAX_LENGTH,
  NOTIFY_MODES,
  SMTP_HOST_PATTERN,
  SMTP_PASSWORD_MAX_LENGTH,
  type MailProvider,
  type MailSettingsChange,
  type MailSettingsResponse,
  type SmtpPort,
} from "@passalio/shared";
import * as z from "zod";
import { configurationFr } from "../../fr-configuration";

const errors = configurationFr.errors;

export const CONFIGURATION_TABS = ["profil", "boite", "rappels", "signature"] as const;

export type ConfigurationTab = (typeof CONFIGURATION_TABS)[number];

export const PORT_CHOICES = ["465", "587"] as const;

const ADDRESS_MAX_LENGTH = 254;

const required = (maxLength: number) =>
  z.string().trim().min(1, errors.required).max(maxLength, errors.tooLong);

const address = z
  .string()
  .trim()
  .min(1, errors.required)
  .max(ADDRESS_MAX_LENGTH, errors.tooLong)
  .pipe(z.email(errors.email));

const optionalAddress = z.union([z.literal(""), address]);

const formFields = {
  senderName: required(MAIL_SENDER_NAME_MAX_LENGTH),
  senderAddress: address,
  replyTo: z.string().trim().pipe(optionalAddress),
  provider: z.enum(MAIL_PROVIDERS),
  smtpHost: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, errors.required)
    .max(253, errors.tooLong)
    .pipe(z.string().regex(SMTP_HOST_PATTERN, errors.host)),
  smtpPort: z.enum(PORT_CHOICES),
  smtpUsername: required(ADDRESS_MAX_LENGTH),
  smtpPassword: z.string().max(SMTP_PASSWORD_MAX_LENGTH, errors.tooLong),
  signature: z.string().max(MAIL_SIGNATURE_MAX_LENGTH, errors.tooLong),
  reminderNotify: z.enum(NOTIFY_MODES),
  reminderAddress: z.string().trim().pipe(optionalAddress),
};

export const configurationFormSchema = (hasPassword: boolean) =>
  z.object(formFields).superRefine(({ smtpPassword }, context) => {
    if (!hasPassword && smtpPassword === "") {
      context.addIssue({ code: "custom", path: ["smtpPassword"], message: errors.required });
    }
  });

export type ConfigurationFormValues = z.input<ReturnType<typeof configurationFormSchema>>;

export type ConfigurationField = keyof ConfigurationFormValues;

export const TAB_OF_FIELD: Readonly<Record<ConfigurationField, ConfigurationTab>> = {
  senderName: "boite",
  senderAddress: "boite",
  replyTo: "boite",
  provider: "boite",
  smtpHost: "boite",
  smtpPort: "boite",
  smtpUsername: "boite",
  smtpPassword: "boite",
  signature: "signature",
  reminderNotify: "rappels",
  reminderAddress: "rappels",
};

const isConfigurationField = (name: string): name is ConfigurationField =>
  Object.hasOwn(TAB_OF_FIELD, name);

export const firstTabWithError = (fields: readonly string[]): ConfigurationTab | null => {
  const tabs = new Set(fields.filter(isConfigurationField).map((name) => TAB_OF_FIELD[name]));
  return CONFIGURATION_TABS.find((tab) => tabs.has(tab)) ?? null;
};

export const portChoiceOf = (port: SmtpPort) => (port === 465 ? "465" : "587");

export const presetOf = (provider: MailProvider) =>
  provider === "other" ? null : MAIL_PROVIDER_PRESETS[provider];

const DEFAULT_PROVIDER = "zoho";

export const configurationFormOf = ({
  member,
  settings,
}: MailSettingsResponse): ConfigurationFormValues => {
  if (settings === null) {
    const preset = MAIL_PROVIDER_PRESETS[DEFAULT_PROVIDER];
    return {
      senderName: member.name,
      senderAddress: member.email,
      replyTo: "",
      provider: DEFAULT_PROVIDER,
      smtpHost: preset.host,
      smtpPort: portChoiceOf(preset.port),
      smtpUsername: member.email,
      smtpPassword: "",
      signature: "",
      reminderNotify: "minutes_15",
      reminderAddress: "",
    };
  }
  return {
    senderName: settings.senderName,
    senderAddress: settings.senderAddress,
    replyTo: settings.replyTo ?? "",
    provider: settings.provider,
    smtpHost: settings.smtpHost,
    smtpPort: portChoiceOf(settings.smtpPort),
    smtpUsername: settings.smtpUsername,
    smtpPassword: "",
    signature: settings.signature ?? "",
    reminderNotify: settings.reminderNotify,
    reminderAddress: settings.reminderAddress ?? "",
  };
};

export const toMailSettingsChange = (values: ConfigurationFormValues): MailSettingsChange => ({
  senderName: values.senderName.trim(),
  senderAddress: values.senderAddress.trim().toLowerCase(),
  replyTo: values.replyTo.trim() === "" ? null : values.replyTo.trim().toLowerCase(),
  provider: values.provider,
  smtpHost: values.smtpHost.trim().toLowerCase(),
  smtpPort: values.smtpPort === "465" ? 465 : 587,
  smtpUsername: values.smtpUsername.trim(),
  ...(values.smtpPassword === "" ? {} : { smtpPassword: values.smtpPassword }),
  signature: values.signature.trim() === "" ? null : values.signature.trim(),
  reminderNotify: values.reminderNotify,
  reminderAddress:
    values.reminderAddress.trim() === "" ? null : values.reminderAddress.trim().toLowerCase(),
});
