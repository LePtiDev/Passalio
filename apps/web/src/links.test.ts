import { describe, expect, it } from "vitest";
import { appUrl } from "./links";

describe("appUrl", () => {
  it("points sign-up and sign-in to the production app by default", () => {
    expect(appUrl("signUp")).toBe("https://app.passalio.com/inscription");
    expect(appUrl("signIn")).toBe("https://app.passalio.com/connexion");
  });

  it("points legal pages to the pages served by the app", () => {
    expect(appUrl("terms")).toBe("https://app.passalio.com/conditions");
    expect(appUrl("privacy")).toBe("https://app.passalio.com/confidentialite");
    expect(appUrl("legalNotice")).toBe("https://app.passalio.com/mentions-legales");
  });

  it("points to the staging app when the site is built for staging", () => {
    expect(appUrl("signUp", "staging")).toBe("https://app.staging.passalio.com/inscription");
  });
});
