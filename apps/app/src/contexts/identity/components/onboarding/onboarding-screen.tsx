import { useCallback } from "react";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization } from "../../hooks/use-organization";
import type { OrganizationProfile } from "../../identity-api";
import { CompanyStep } from "./company-step";
import { DocumentsStep } from "./documents-step";
import { OnboardingBody, OnboardingLayout } from "./onboarding-layout";
import type { OnboardingStep } from "./onboarding-steps";
import { TeamStep } from "./team-step";
import { TradesStep } from "./trades-step";

const OnboardingSkeleton = () => (
  <OnboardingBody width="medium">
    <div className="flex flex-col gap-2" aria-busy="true">
      <Skeleton className="hidden h-3 w-24 lg:block" />
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="grid gap-2.5 sm:grid-cols-2">
      <Skeleton className="h-[60px] rounded-xl" />
      <Skeleton className="h-[60px] rounded-xl" />
      <Skeleton className="h-[60px] rounded-xl" />
      <Skeleton className="h-[60px] rounded-xl" />
    </div>
  </OnboardingBody>
);

const StepContent = ({
  step,
  organization,
}: {
  readonly step: Exclude<OnboardingStep, 2>;
  readonly organization: OrganizationProfile;
}) => {
  if (step === 3) {
    return <TradesStep organization={organization} />;
  }
  if (step === 4) {
    return <DocumentsStep organization={organization} />;
  }
  return <TeamStep />;
};

const OrganizationStep = ({ step }: { readonly step: Exclude<OnboardingStep, 2> }) => {
  const { data, error, refetch } = useOrganization();
  const retry = useCallback(() => void refetch(), [refetch]);
  if (error !== null) {
    return (
      <OnboardingBody width="medium">
        <ErrorState error={error} onRetry={retry} />
      </OnboardingBody>
    );
  }
  return data === undefined ? (
    <OnboardingSkeleton />
  ) : (
    <StepContent step={step} organization={data} />
  );
};

const CompanyStepLoader = () => {
  const { data, error, refetch } = useOrganization();
  const retry = useCallback(() => void refetch(), [refetch]);
  if (error !== null) {
    return (
      <OnboardingBody width="narrow">
        <ErrorState error={error} onRetry={retry} />
      </OnboardingBody>
    );
  }
  return data === undefined ? <OnboardingSkeleton /> : <CompanyStep organization={data} />;
};

type OnboardingScreenProps = {
  readonly step: OnboardingStep;
  readonly hasOrganization: boolean;
};

export const OnboardingScreen = ({ step, hasOrganization }: OnboardingScreenProps) => {
  if (step === 2) {
    return (
      <OnboardingLayout step={2}>
        {hasOrganization ? <CompanyStepLoader /> : <CompanyStep organization={null} />}
      </OnboardingLayout>
    );
  }
  return (
    <OnboardingLayout step={step}>
      <OrganizationStep step={step} />
    </OnboardingLayout>
  );
};
