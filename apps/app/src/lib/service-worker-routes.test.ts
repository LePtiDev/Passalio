import { describe, expect, it } from "vitest";
import { isServedByNetworkOnly } from "./service-worker-routes";

describe("service worker navigation fallback", () => {
  it.each([
    "/api/admin/me",
    "/health",
    "/mcp",
    "/oauth/token",
    "/.well-known/oauth-authorization-server",
  ])("leaves %s to the network", (path) => {
    expect(isServedByNetworkOnly(path)).toBe(true);
  });

  it("always loads the Claude authorization page from the network, never from an old cached app", () => {
    expect(isServedByNetworkOnly("/admin/mcp/autoriser")).toBe(true);
  });

  it("keeps serving the app shell offline for the other screens", () => {
    expect(isServedByNetworkOnly("/admin")).toBe(false);
    expect(isServedByNetworkOnly("/clients")).toBe(false);
  });
});
