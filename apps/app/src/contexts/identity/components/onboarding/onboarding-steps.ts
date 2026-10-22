export const ONBOARDING_STEP_COUNT = 5;

export type OnboardingStep = 2 | 3 | 4 | 5;

export const ONBOARDING_PATHS = {
  2: "/configuration/entreprise",
  3: "/configuration/metiers",
  4: "/configuration/documents",
  5: "/configuration/equipe",
} as const;
