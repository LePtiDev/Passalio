import type { MailSettingsResponse } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import { configurationFr } from "../../fr-configuration";
import {
  configurationFormOf,
  configurationFormSchema,
  firstTabWithError,
  presetOf,
  toMailSettingsChange,
  type ConfigurationFormValues,
} from "./configuration-form-schema";

const errors = configurationFr.errors;

const MEMBER = { name: "Antho", email: "antho@passalio.fr" };

const SAVED: NonNullable<MailSettingsResponse["settings"]> = {
  senderName: "Antho, Passalio",
  senderAddress: "antho@passalio.fr",
  replyTo: null,
  provider: "ovh_email_pro",
  smtpHost: "pro1.mail.ovh.net",
  smtpPort: 587,
  smtpUsername: "antho@passalio.fr",
  hasPassword: true,
  passwordUpdatedAt: "2026-10-24T07:40:00.000Z",
  verifiedAt: null,
  signature: "Antho\nPassalio",
  reminderNotify: "day_before",
  reminderAddress: "rappels@passalio.fr",
  updatedAt: "2026-10-24T07:40:00.000Z",
  updatedBy: null,
};

const values = (overrides: Partial<ConfigurationFormValues> = {}): ConfigurationFormValues => ({
  ...configurationFormOf({ userId: "u", member: MEMBER, settings: SAVED }),
  ...overrides,
});

const issuesOf = (form: ConfigurationFormValues, hasPassword = true) => {
  const parsed = configurationFormSchema(hasPassword).safeParse(form);
  return parsed.success
    ? {}
    : Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]));
};

describe("configurationFormOf", () => {
  it("starts a new mailbox from the member and the Zoho preset", () => {
    expect(configurationFormOf({ userId: "u", member: MEMBER, settings: null })).toEqual({
      senderName: "Antho",
      senderAddress: "antho@passalio.fr",
      replyTo: "",
      provider: "zoho",
      smtpHost: "smtp.zoho.eu",
      smtpPort: "465",
      smtpUsername: "antho@passalio.fr",
      smtpPassword: "",
      signature: "",
      reminderNotify: "minutes_15",
      reminderAddress: "",
    });
  });

  it("fills the saved settings and never the password", () => {
    expect(values()).toMatchObject({
      provider: "ovh_email_pro",
      smtpPort: "587",
      replyTo: "",
      smtpPassword: "",
      signature: "Antho\nPassalio",
      reminderAddress: "rappels@passalio.fr",
    });
  });
});

describe("configurationFormSchema", () => {
  it("accepts the saved settings without retyping the password", () => {
    expect(issuesOf(values())).toEqual({});
  });

  it("asks for the password the first time", () => {
    expect(issuesOf(values(), false)).toEqual({ smtpPassword: errors.required });
    expect(issuesOf(values({ smtpPassword: "secret" }), false)).toEqual({});
  });

  it("requires the name, address, server and username", () => {
    expect(
      issuesOf(values({ senderName: " ", senderAddress: "", smtpHost: "", smtpUsername: "" })),
    ).toEqual({
      senderName: errors.required,
      senderAddress: errors.required,
      smtpHost: errors.required,
      smtpUsername: errors.required,
    });
  });

  it("checks the addresses and the server", () => {
    expect(
      issuesOf(
        values({
          senderAddress: "antho",
          replyTo: "pas une adresse",
          reminderAddress: "x@",
          smtpHost: "smtp zoho",
        }),
      ),
    ).toEqual({
      senderAddress: errors.email,
      replyTo: errors.email,
      reminderAddress: errors.email,
      smtpHost: errors.host,
    });
  });
});

describe("toMailSettingsChange", () => {
  it("sends empty optional fields as null and keeps the password when left blank", () => {
    const change = toMailSettingsChange(values({ replyTo: " ", signature: "  " }));
    expect(change).toEqual({
      senderName: "Antho, Passalio",
      senderAddress: "antho@passalio.fr",
      replyTo: null,
      provider: "ovh_email_pro",
      smtpHost: "pro1.mail.ovh.net",
      smtpPort: 587,
      smtpUsername: "antho@passalio.fr",
      signature: null,
      reminderNotify: "day_before",
      reminderAddress: "rappels@passalio.fr",
    });
    expect(change).not.toHaveProperty("smtpPassword");
  });

  it("sends a new password and lowercases the addresses and server", () => {
    expect(
      toMailSettingsChange(
        values({
          smtpPassword: "Nouveau-Mot",
          senderAddress: "Antho@Passalio.FR",
          smtpHost: "SMTP.Zoho.EU",
          smtpPort: "465",
        }),
      ),
    ).toMatchObject({
      smtpPassword: "Nouveau-Mot",
      senderAddress: "antho@passalio.fr",
      smtpHost: "smtp.zoho.eu",
      smtpPort: 465,
    });
  });
});

describe("firstTabWithError", () => {
  it("opens the first rubric that holds an error, in the order of the menu", () => {
    expect(firstTabWithError(["signature", "reminderAddress"])).toBe("rappels");
    expect(firstTabWithError(["signature", "smtpHost"])).toBe("boite");
    expect(firstTabWithError([])).toBeNull();
  });
});

describe("presetOf", () => {
  it("knows the server of each provider but not of another one", () => {
    expect(presetOf("ovh_mx_plan")).toEqual({ host: "ssl0.ovh.net", port: 465 });
    expect(presetOf("other")).toBeNull();
  });
});
