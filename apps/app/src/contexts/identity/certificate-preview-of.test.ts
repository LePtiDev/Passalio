import { describe, expect, it } from "vitest";
import { organizationProfile } from "@/test-support/identity-replies";
import { documentSettings } from "@/test-support/settings-replies";
import { certificatePreviewOf } from "./certificate-preview-of";
import { documentSettingsOf } from "./document-settings-form";

const organization = organizationProfile({ documentNumberPrefix: "RD-", nextDocumentNumber: 8 });

describe("certificatePreviewOf", () => {
  it("previews the real company with the unsaved appearance", () => {
    const settings = documentSettings();
    const values = {
      ...documentSettingsOf(organization, settings),
      documentTemplate: "plain" as const,
      phone: "06 01 02 03 04",
      footerText: "Assurance AXA",
    };

    const { preview, isSampleCompany } = certificatePreviewOf({
      organization,
      settings,
      values,
      logo: null,
    });

    expect(isSampleCompany).toBe(false);
    expect(preview.number).toBe("RD-0008");
    expect(preview.company).toMatchObject({
      name: "Ramonage Dupont",
      siren: "123456789",
      phone: "06 01 02 03 04",
    });
    expect(preview.branding).toMatchObject({
      template: "plain",
      footerText: "Assurance AXA",
      contact: { phone: "06 01 02 03 04", email: null, website: null },
    });
  });

  it("falls back to sample legal details while the company is incomplete", () => {
    const settings = documentSettings({ legalForm: null });

    const { preview, isSampleCompany } = certificatePreviewOf({
      organization,
      settings,
      values: documentSettingsOf(organization, settings),
      logo: null,
    });

    expect(isSampleCompany).toBe(true);
    expect(preview.company).toEqual({ name: "Ramonage Dupont", phone: null, qualification: null });
  });
});
