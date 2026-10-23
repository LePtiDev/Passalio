export const APP_ORIGIN = "https://app.passalio.com";

export const APP_PATHS = {
  signIn: "/connexion",
  signUp: "/inscription",
  terms: "/conditions",
  privacy: "/confidentialite",
  legalNotice: "/mentions-legales",
} as const;

export type AppPage = keyof typeof APP_PATHS;

export const appUrl = (page: AppPage): string => new URL(APP_PATHS[page], APP_ORIGIN).toString();
