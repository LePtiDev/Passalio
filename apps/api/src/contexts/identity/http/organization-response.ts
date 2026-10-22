import type { OrganizationProfile } from "../domain/organization-profile";

export const toOrganizationResponse = ({
  logoKey,
  onboardingCompletedAt,
  slug: _slug,
  ...profile
}: OrganizationProfile) => ({
  ...profile,
  hasLogo: logoKey !== null,
  isOnboardingCompleted: onboardingCompletedAt !== null,
});
