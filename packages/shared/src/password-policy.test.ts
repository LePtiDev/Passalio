import { describe, expect, it } from "vitest";
import { passwordStrength } from "./password-policy";

describe("passwordStrength", () => {
  it("is empty for an empty password", () => {
    expect(passwordStrength("")).toBe(0);
  });

  it("is too weak under 12 characters", () => {
    expect(passwordStrength("Court-1")).toBe(1);
  });

  it("is too weak with a long repeated character", () => {
    expect(passwordStrength("aaaaaaaaaaaaaaaa")).toBe(1);
  });

  it("is fair for 12 lowercase letters", () => {
    expect(passwordStrength("cheminevieux")).toBe(2);
  });

  it("is good with mixed characters", () => {
    expect(passwordStrength("chemine-2026")).toBe(3);
  });

  it("is strong for a long passphrase", () => {
    expect(passwordStrength("ramonage du jeudi matin")).toBe(4);
  });
});
