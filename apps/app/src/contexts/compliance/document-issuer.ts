import {
  certificateCompanyOf,
  missingLegalMentions,
  type CompanyLegalDetails,
  type DocumentLogo,
} from "@passalio/trades";
import type { DocumentSettings, OrganizationProfile } from "@/contexts/identity";
import type { DocumentIssuer } from "@/lib/db/compliance-records";

type IssuerSource = {
  readonly organization: OrganizationProfile;
  readonly settings: DocumentSettings;
  readonly logo: DocumentLogo | null;
};

const textOrNull = (value: string | null) =>
  value === null || value.trim() === "" ? null : value.trim();

export const documentIssuerOf = ({
  organization,
  settings,
  logo,
}: IssuerSource): DocumentIssuer => {
  const phone = textOrNull(organization.phone);
  const details: CompanyLegalDetails = {
    name: organization.name,
    legalForm: settings.legalForm,
    shareCapitalEuros: settings.shareCapitalEuros,
    siret: organization.siret,
    registryKind: settings.registryKind,
    registryCity: settings.registryCity,
    address: organization.address,
    phone,
    qualification: textOrNull(settings.qualification),
  };
  const company = certificateCompanyOf(details);
  return {
    company: company.isOk ? company.value : null,
    missingLegalMentions: [...missingLegalMentions(details)],
    branding: {
      template: settings.documentTemplate,
      brandColor: organization.brandColor,
      logo,
      contact: {
        phone,
        email: textOrNull(settings.contactEmail),
        website: textOrNull(settings.website),
      },
      customerMessage: textOrNull(settings.customerMessage),
      footerText: textOrNull(settings.footerText),
    },
  };
};
