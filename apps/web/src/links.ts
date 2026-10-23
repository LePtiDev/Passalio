import { SITE_ENVIRONMENT, type SiteEnvironment, appOriginFor } from "./site-environment";

export const APP_PATHS = {
  signIn: "/connexion",
  signUp: "/inscription",
  terms: "/conditions",
  privacy: "/confidentialite",
  legalNotice: "/mentions-legales",
} as const;

export type AppPage = keyof typeof APP_PATHS;

export const appUrl = (page: AppPage, environment: SiteEnvironment = SITE_ENVIRONMENT): string =>
  new URL(APP_PATHS[page], appOriginFor(environment)).toString();
