import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { onboardingFr } from "../../onboarding-fr";
import { ONBOARDING_PATHS, type OnboardingStep } from "./onboarding-steps";
import { ONBOARDING_SECONDARY_BUTTON_CLASS } from "./onboarding-styles";

export const BackButton = ({ to }: { readonly to: Exclude<OnboardingStep, 5> }) => (
  <Button
    asChild
    variant="outline"
    className={`${ONBOARDING_SECONDARY_BUTTON_CLASS} w-24 lg:w-auto`}
  >
    <Link to={ONBOARDING_PATHS[to]}>{onboardingFr.layout.back}</Link>
  </Button>
);
