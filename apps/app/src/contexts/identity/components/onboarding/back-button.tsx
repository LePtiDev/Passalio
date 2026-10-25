import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { onboardingFr } from "../../onboarding-fr";
import { ONBOARDING_PATHS, type OnboardingStep } from "./onboarding-steps";

export const BackButton = ({ to }: { readonly to: Exclude<OnboardingStep, 5> }) => (
  <Button asChild variant="secondary" className="w-24 lg:w-auto">
    <Link to={ONBOARDING_PATHS[to]}>{onboardingFr.layout.back}</Link>
  </Button>
);
