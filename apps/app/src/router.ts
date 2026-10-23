import { createRouter } from "@tanstack/react-router";
import { forgotPasswordRoute } from "./routes/forgot-password";
import { homeRoute } from "./routes/home";
import { invitationRoute } from "./routes/invitation";
import { legalNoticeRoute, privacyRoute, termsRoute } from "./routes/legal";
import {
  onboardingCompanyRoute,
  onboardingDocumentsRoute,
  onboardingTeamRoute,
  onboardingTradesRoute,
} from "./routes/onboarding";
import { resetPasswordRoute } from "./routes/reset-password";
import { settingsRoute } from "./routes/settings";
import { rootRoute } from "./routes/root";
import { signInRoute } from "./routes/sign-in";
import { signUpRoute } from "./routes/sign-up";
import { signedInRoute } from "./routes/signed-in-layout";
import { teamRoute } from "./routes/team";

const routeTree = rootRoute.addChildren([
  signInRoute,
  signUpRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  onboardingCompanyRoute,
  onboardingTradesRoute,
  onboardingDocumentsRoute,
  onboardingTeamRoute,
  invitationRoute,
  termsRoute,
  privacyRoute,
  legalNoticeRoute,
  signedInRoute.addChildren([homeRoute, teamRoute, settingsRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
