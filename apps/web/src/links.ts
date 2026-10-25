import { SITE_ENVIRONMENT, type SiteEnvironment, appOriginFor } from "./site-environment";

export const APP_PATHS = {
  signIn: "/connexion",
  signUp: "/inscription",
  terms: "/conditions",
  privacy: "/confidentialite",
  legalNotice: "/mentions-legales",
} as const;

export const API_PATHS = {
  callbackRequests: "/api/public/callback-requests",
  pageViews: "/api/public/page-views",
} as const;

export type AppPage = keyof typeof APP_PATHS;

export type ApiEndpoint = keyof typeof API_PATHS;

export const appUrl = (page: AppPage, environment: SiteEnvironment = SITE_ENVIRONMENT): string =>
  new URL(APP_PATHS[page], appOriginFor(environment)).toString();

export const apiUrl = (
  endpoint: ApiEndpoint,
  environment: SiteEnvironment = SITE_ENVIRONMENT,
): string => new URL(API_PATHS[endpoint], appOriginFor(environment)).toString();
