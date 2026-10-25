import { createRouter } from "@tanstack/react-router";
import { parseSearchWithoutForeignReturn } from "./routes/parse-search";
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
  adminSettingsRoute,
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
import { adminCallSessionRoute, adminCallsRoute, adminMyDayRoute } from "./routes/admin-calls";
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
import {
  companySettingsRoute,
  documentSettingsRoute,
  servicesRoute,
  settingsRoute,
} from "./routes/settings";
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
      adminSettingsRoute,
      adminCompaniesRoute,
      adminCompanyRoute,
      adminContactsRoute,
      adminContactRoute,
      adminProspectionRoute,
      adminMyDayRoute,
      adminCallsRoute,
      adminCallSessionRoute,
    ]),
  ]),
  signedInRoute.addChildren([
    homeRoute,
    teamRoute,
    settingsRoute,
    servicesRoute,
    companySettingsRoute,
    documentSettingsRoute,
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

export const router = createRouter({ routeTree, parseSearch: parseSearchWithoutForeignReturn });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
