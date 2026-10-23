import { describe, expect, it } from "vitest";
import { isIndexable, toSiteEnvironment } from "./site-environment";

describe("site environment", () => {
  it("falls back to production when the variable is missing or unknown", () => {
    expect(toSiteEnvironment(undefined)).toBe("production");
    expect(toSiteEnvironment("preview")).toBe("production");
  });

  it("keeps search engines away from staging only", () => {
    expect(isIndexable(toSiteEnvironment("staging"))).toBe(false);
    expect(isIndexable(toSiteEnvironment("production"))).toBe(true);
  });
});
