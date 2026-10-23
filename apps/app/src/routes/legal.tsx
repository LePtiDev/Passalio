import { createRoute } from "@tanstack/react-router";
import { LEGAL_NOTICE_FR, LEGAL_PATHS, LegalPage, PRIVACY_FR, TERMS_FR } from "@/legal";
import { rootRoute } from "./root";

export const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: LEGAL_PATHS.terms,
  component: () => <LegalPage content={TERMS_FR} />,
});

export const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: LEGAL_PATHS.privacy,
  component: () => <LegalPage content={PRIVACY_FR} />,
});

export const legalNoticeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: LEGAL_PATHS.legalNotice,
  component: () => <LegalPage content={LEGAL_NOTICE_FR} />,
});
