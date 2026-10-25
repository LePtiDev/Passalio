import { missingLegalMentions } from "@passalio/trades";
import type { OrganizationProfile } from "../domain/organization-profile";

export const toOrganizationResponse = (profile: OrganizationProfile) => ({
  id: profile.id,
  name: profile.name,
  siret: profile.siret,
  address: profile.address,
  phone: profile.phone,
  teamSize: profile.teamSize,
  trades: profile.trades,
  brandColor: profile.brandColor,
  documentNumberPrefix: profile.documentNumberPrefix,
  nextDocumentNumber: profile.nextDocumentNumber,
  hasLogo: profile.logoKey !== null,
  isOnboardingCompleted: profile.onboardingCompletedAt !== null,
});

export const toDocumentSettingsResponse = (profile: OrganizationProfile) => ({
  legalForm: profile.legalForm,
  shareCapitalEuros: profile.shareCapitalEuros,
  registryKind: profile.registryKind,
  registryCity: profile.registryCity,
  apeCode: profile.apeCode,
  qualification: profile.qualification,
  documentTemplate: profile.documentTemplate,
  contactEmail: profile.contactEmail,
  website: profile.website,
  customerMessage: profile.customerMessage,
  footerText: profile.footerText,
  hasReservedNumbers: profile.hasReservedNumbers,
  missingLegalMentions: missingLegalMentions(profile),
});
