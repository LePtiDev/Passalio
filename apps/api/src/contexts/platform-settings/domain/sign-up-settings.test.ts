import { describe, expect, it } from "vitest";
import {
  DEFAULT_SIGN_UP_SETTINGS,
  isSignUpAllowed,
  normalizeSignUpEmail,
} from "./sign-up-settings";

describe("sign-up settings", () => {
  it("keeps sign-up open until someone closes it", () => {
    expect(DEFAULT_SIGN_UP_SETTINGS).toEqual({
      isSignUpOpen: true,
      changedAt: null,
      changedByName: null,
    });
  });

  it("allows anyone to sign up while sign-up is open", () => {
    expect(isSignUpAllowed({ isSignUpOpen: true }, false)).toBe(true);
  });

  it("allows only an invited person to sign up while sign-up is closed", () => {
    expect(isSignUpAllowed({ isSignUpOpen: false }, true)).toBe(true);
    expect(isSignUpAllowed({ isSignUpOpen: false }, false)).toBe(false);
  });

  it("compares sign-up emails without spaces or capitals", () => {
    expect(normalizeSignUpEmail("  Marie.Dupont@Example.FR ")).toBe("marie.dupont@example.fr");
  });
});
