import type { PlatformEnvironment } from "./settings-fr";

export const platformEnvironmentOf = (hostname: string): PlatformEnvironment => {
  if (hostname === "app.passalio.com") {
    return "production";
  }
  if (hostname === "app.staging.passalio.com") {
    return "staging";
  }
  return "local";
};
