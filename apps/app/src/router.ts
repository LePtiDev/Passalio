import { createRouter } from "@tanstack/react-router";
import {
  customerRoute,
  customersRoute,
  editCustomerRoute,
  newCustomerRoute,
  newEquipmentRoute,
  newSiteRoute,
} from "./routes/customers";
import {
  adminAccountRoute,
  adminAccountsRoute,
  adminJournalRoute,
  adminOverviewRoute,
  adminRootRoute,
  adminShellRoute,
  adminTeamRoute,
} from "./routes/admin";
import {
  adminCompaniesRoute,
  adminCompanyRoute,
  adminContactRoute,
  adminProspectionRoute,
  adminContactsRoute,
} from "./routes/admin-commercial";
import { adminMcpAuthorizeRoute } from "./routes/admin-mcp";
import { adminCodeRoute, adminSecurityRoute } from "./routes/admin-security";
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
import { newVisitRoute, planningRoute, visitRoute } from "./routes/planning";
import { resetPasswordRoute } from "./routes/reset-password";
import { settingsRoute } from "./routes/settings";
import { rootRoute } from "./routes/root";
import { signInRoute } from "./routes/sign-in";
import { signInCodeRoute } from "./routes/sign-in-code";
import { signUpRoute } from "./routes/sign-up";
import { signedInRoute } from "./routes/signed-in-layout";
import { teamRoute } from "./routes/team";
import { teamInvitationRoute } from "./routes/team-invitation";

const routeTree = rootRoute.addChildren([
  signInRoute,
  signInCodeRoute,
  signUpRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  onboardingCompanyRoute,
  onboardingTradesRoute,
  onboardingDocumentsRoute,
  onboardingTeamRoute,
  invitationRoute,
  teamInvitationRoute,
  termsRoute,
  privacyRoute,
  legalNoticeRoute,
  adminRootRoute.addChildren([
    adminCodeRoute,
    adminSecurityRoute,
    adminMcpAuthorizeRoute,
    adminShellRoute.addChildren([
      adminOverviewRoute,
      adminAccountsRoute,
      adminAccountRoute,
      adminJournalRoute,
      adminTeamRoute,
      adminCompaniesRoute,
      adminCompanyRoute,
      adminContactsRoute,
      adminContactRoute,
      adminProspectionRoute,
    ]),
  ]),
  signedInRoute.addChildren([
    homeRoute,
    teamRoute,
    settingsRoute,
    customersRoute,
    newCustomerRoute,
    customerRoute,
    editCustomerRoute,
    newSiteRoute,
    newEquipmentRoute,
    planningRoute,
    newVisitRoute,
    visitRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
