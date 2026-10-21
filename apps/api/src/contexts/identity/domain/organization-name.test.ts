import { describe, expect, it } from "vitest";
import { normalizeOrganizationName, toSlug } from "./organization-name";

describe("normalizeOrganizationName", () => {
  it("trims and collapses spaces", () => {
    expect(normalizeOrganizationName("  Ramonage   Dupont ")).toEqual({
      isOk: true,
      value: "Ramonage Dupont",
    });
  });

  it.each(["", " a ", "x".repeat(101)])("refuses %j", (name) => {
    expect(normalizeOrganizationName(name)).toEqual({
      isOk: false,
      error: "invalid_organization_name",
    });
  });
});

describe("toSlug", () => {
  it("removes accents and keeps a unique suffix", () => {
    expect(toSlug("Ramonage Hélène & Fils", "0199-aaaa-bbbb-123456")).toBe(
      "ramonage-helene-fils-123456",
    );
  });

  it("falls back to the suffix when the name has no letters", () => {
    expect(toSlug("!!!", "abcdef")).toBe("abcdef");
  });
});
