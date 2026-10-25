import { describe, expect, it } from "vitest";
import { organizationProfile } from "@/test-support/identity-replies";
import { documentSettings } from "@/test-support/settings-replies";
import {
  documentSettingsChanges,
  documentSettingsOf,
  documentSettingsSchema,
  nextCertificateNumber,
  type DocumentSettingsValues,
} from "./document-settings-form";
import { settingsFr } from "./settings-fr";

const text = settingsFr.documents.errors;

const VALUES: DocumentSettingsValues = documentSettingsOf(
  organizationProfile({ documentNumberPrefix: "RD-", nextDocumentNumber: 42 }),
  documentSettings(),
);

const errorsOf = (values: DocumentSettingsValues) => {
  const result = documentSettingsSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
};

describe("documentSettingsSchema", () => {
  it("accepts the saved settings", () => {
    expect(VALUES.nextDocumentNumber).toBe("0042");
    expect(errorsOf(VALUES)).toEqual({});
  });

  it("refuses an invalid e-mail, prefix and next number", () => {
    expect(
      errorsOf({
        ...VALUES,
        contactEmail: "contact@",
        documentNumberPrefix: "RD !",
        nextDocumentNumber: "0",
      }),
    ).toEqual({
      contactEmail: text.email,
      documentNumberPrefix: text.prefix,
      nextDocumentNumber: text.nextNumber,
    });
  });

  it("refuses a customer message over 300 characters", () => {
    expect(errorsOf({ ...VALUES, customerMessage: "a".repeat(301) })).toEqual({
      customerMessage: text.tooLong,
    });
  });
});

describe("documentSettingsChanges", () => {
  it("sends blank texts as null and the number as a number", () => {
    expect(
      documentSettingsChanges({ ...VALUES, website: "  ", footerText: " Assurance AXA " }),
    ).toEqual({
      documentTemplate: "banner",
      brandColor: "#0F2A44",
      phone: null,
      contactEmail: null,
      website: null,
      qualification: null,
      customerMessage: null,
      footerText: "Assurance AXA",
      documentNumberPrefix: "RD-",
      nextDocumentNumber: 42,
    });
  });
});

describe("nextCertificateNumber", () => {
  it("pads the next number to four digits after the prefix", () => {
    expect(nextCertificateNumber({ documentNumberPrefix: "2026-", nextDocumentNumber: "7" })).toBe(
      "2026-0007",
    );
    expect(nextCertificateNumber({ documentNumberPrefix: "", nextDocumentNumber: "12345" })).toBe(
      "12345",
    );
  });
});
