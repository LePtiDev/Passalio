import { MCP_SCOPES } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import { accessOfScopes, actorOfMcpCaller, scopesOfAccess, type McpCaller } from "./mcp-access";
import { isAllowedRedirectUri } from "./redirect-policy";

const caller = (overrides: Partial<McpCaller> = {}): McpCaller => ({
  userId: "user-1",
  email: "admin@passalio.com",
  name: "Admin",
  role: "superadmin",
  isBanned: false,
  ...overrides,
});

describe("actorOfMcpCaller", () => {
  it.each([
    ["superadmin", true],
    ["admin", true],
    ["sales", false],
    ["user", false],
    [null, false],
  ])("role %s is allowed: %s", (role, expected) => {
    expect(actorOfMcpCaller(caller({ role })).isOk).toBe(expected);
  });

  it("refuses a blocked account", () => {
    expect(actorOfMcpCaller(caller({ isBanned: true })).isOk).toBe(false);
  });

  it("refuses an unknown person", () => {
    expect(actorOfMcpCaller(undefined).isOk).toBe(false);
  });
});

describe("scopes", () => {
  it("gives read and write for write access", () => {
    expect(scopesOfAccess("write")).toEqual([MCP_SCOPES.read, MCP_SCOPES.write]);
    expect(accessOfScopes(scopesOfAccess("write"))).toBe("write");
  });

  it("gives read only for read access", () => {
    expect(scopesOfAccess("read")).toEqual([MCP_SCOPES.read]);
    expect(accessOfScopes(scopesOfAccess("read"))).toBe("read");
  });

  it("gives nothing for unknown scopes", () => {
    expect(accessOfScopes(["openid"])).toBeNull();
  });
});

describe("isAllowedRedirectUri", () => {
  it.each([
    ["https://claude.ai/api/mcp/auth_callback", true],
    ["https://claude.com/api/mcp/auth_callback", true],
    ["https://app.claude.ai/callback", true],
    ["http://localhost:6274/callback", true],
    ["http://127.0.0.1:33418/callback", true],
    ["http://claude.ai/callback", false],
    ["https://claude.ai.evil.com/callback", false],
    ["https://evilclaude.ai/callback", false],
    ["https://example.com/callback", false],
    ["javascript:alert(1)", false],
    ["pas une adresse", false],
  ])("%s is %s", (uri, expected) => {
    expect(isAllowedRedirectUri(uri)).toBe(expected);
  });
});
