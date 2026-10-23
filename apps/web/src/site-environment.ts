const APP_ORIGINS = {
  staging: "https://app.staging.passalio.com",
  production: "https://app.passalio.com",
} as const;

export type SiteEnvironment = keyof typeof APP_ORIGINS;

export const toSiteEnvironment = (value: string | undefined): SiteEnvironment =>
  value === "staging" ? "staging" : "production";

export const appOriginFor = (environment: SiteEnvironment): string => APP_ORIGINS[environment];

export const isIndexable = (environment: SiteEnvironment): boolean => environment === "production";

export const SITE_ENVIRONMENT = toSiteEnvironment(import.meta.env.PUBLIC_SITE_ENV);
