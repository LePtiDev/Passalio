import { describe, expect, it } from "vitest";
import { apiUrl } from "./links";

describe("apiUrl", () => {
  it("sends public requests to the production API by default", () => {
    expect(apiUrl("callbackRequests")).toBe(
      "https://app.passalio.com/api/public/callback-requests",
    );
    expect(apiUrl("pageViews")).toBe("https://app.passalio.com/api/public/page-views");
  });

  it("sends public requests to the staging API when the site is built for staging", () => {
    expect(apiUrl("callbackRequests", "staging")).toBe(
      "https://app.staging.passalio.com/api/public/callback-requests",
    );
  });
});
