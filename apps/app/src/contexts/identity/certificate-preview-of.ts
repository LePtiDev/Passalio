import type { CertificatePreview } from "@passalio/pdf";
import { certificateCompanyOf } from "@passalio/trades";
import type { PdfLogo } from "@/lib/pdf/logo-for-pdf";
import type { DocumentSettings } from "./document-settings-api";
import { nextCertificateNumber, type DocumentSettingsValues } from "./document-settings-form";
import type { OrganizationProfile } from "./identity-api";

type PreviewSource = {
  readonly organization: OrganizationProfile;
  readonly settings: DocumentSettings;
  readonly values: DocumentSettingsValues;
  readonly logo: PdfLogo | null;
};

const textOrNull = (value: string) => (value.trim() === "" ? null : value.trim());

export const certificatePreviewOf = ({
  organization,
  settings,
  values,
  logo,
}: PreviewSource): { readonly preview: CertificatePreview; readonly isSampleCompany: boolean } => {
  const phone = textOrNull(values.phone);
  const qualification = textOrNull(values.qualification);
  const company = certificateCompanyOf({
    name: organization.name,
    legalForm: settings.legalForm,
    shareCapitalEuros: settings.shareCapitalEuros,
    siret: organization.siret,
    registryKind: settings.registryKind,
    registryCity: settings.registryCity,
    address: organization.address,
    phone,
    qualification,
  });
  return {
    isSampleCompany: !company.isOk,
    preview: {
      company: company.isOk ? company.value : { name: organization.name, phone, qualification },
      branding: {
        template: values.documentTemplate,
        brandColor: values.brandColor,
        logo,
        contact: {
          phone,
          email: textOrNull(values.contactEmail),
          website: textOrNull(values.website),
        },
        customerMessage: textOrNull(values.customerMessage),
        footerText: textOrNull(values.footerText),
      },
      number: nextCertificateNumber(values),
    },
  };
};
