import { createRoute } from "@tanstack/react-router";
import { FormSkeleton } from "@/components/page-skeleton";
import { ONBOARDING_PATHS, OnboardingScreen } from "@/contexts/identity";
import { ensureActiveOrganization, loadOrganizationState } from "@/lib/session";
import { rootRoute } from "./root";

const OnboardingPending = () => (
  <main className="mx-auto max-w-[520px] p-5">
    <FormSkeleton />
  </main>
);

export const onboardingCompanyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ONBOARDING_PATHS[2],
  beforeLoad: ({ location }) => loadOrganizationState(location.href),
  pendingComponent: OnboardingPending,
  component: function OnboardingCompanyScreen() {
    const { hasOrganization } = onboardingCompanyRoute.useRouteContext();
    return <OnboardingScreen step={2} hasOrganization={hasOrganization} />;
  },
});

export const onboardingTradesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ONBOARDING_PATHS[3],
  beforeLoad: ({ location }) => ensureActiveOrganization(location.href),
  pendingComponent: OnboardingPending,
  component: () => <OnboardingScreen step={3} hasOrganization />,
});

export const onboardingDocumentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ONBOARDING_PATHS[4],
  beforeLoad: ({ location }) => ensureActiveOrganization(location.href),
  pendingComponent: OnboardingPending,
  component: () => <OnboardingScreen step={4} hasOrganization />,
});

export const onboardingTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ONBOARDING_PATHS[5],
  beforeLoad: ({ location }) => ensureActiveOrganization(location.href),
  pendingComponent: OnboardingPending,
  component: () => <OnboardingScreen step={5} hasOrganization />,
});
