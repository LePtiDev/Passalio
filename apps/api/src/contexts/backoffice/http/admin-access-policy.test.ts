import { describe, expect, it } from "vitest";
import { adminAccessPolicyOf } from "./admin-access-policy";

describe("adminAccessPolicyOf", () => {
  it("requires two-factor when the setting is absent", () => {
    expect(adminAccessPolicyOf({})).toEqual({ isTwoFactorRequired: true });
  });

  it("requires two-factor for any value other than false", () => {
    expect(adminAccessPolicyOf({ ADMIN_TWO_FACTOR_REQUIRED: "true" })).toEqual({
      isTwoFactorRequired: true,
    });
    expect(adminAccessPolicyOf({ ADMIN_TWO_FACTOR_REQUIRED: "no" })).toEqual({
      isTwoFactorRequired: true,
    });
  });

  it("stops requiring two-factor when the setting is false", () => {
    expect(adminAccessPolicyOf({ ADMIN_TWO_FACTOR_REQUIRED: "false" })).toEqual({
      isTwoFactorRequired: false,
    });
  });
});
