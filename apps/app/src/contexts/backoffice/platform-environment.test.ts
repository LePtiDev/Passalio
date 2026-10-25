import { describe, expect, it } from "vitest";
import { platformEnvironmentOf } from "./platform-environment";

describe("platformEnvironmentOf", () => {
  it.each([
    ["app.passalio.com", "production"],
    ["app.staging.passalio.com", "staging"],
    ["localhost", "local"],
    ["passalio.com", "local"],
  ])("names %s as %s", (hostname, environment) => {
    expect(platformEnvironmentOf(hostname)).toBe(environment);
  });
});
