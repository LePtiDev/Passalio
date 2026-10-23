import {
  mcpRedirectResponse,
  prospectCompanyFileResponse,
  prospectCompanyResponse,
} from "@passalio/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../src/platform/database";
import {
  countMcpCall,
  MCP_CALLS_PER_MINUTE,
} from "../src/contexts/mcp/infrastructure/mcp-rate-limit";
import { grantPlatformRole, signInAsAdmin } from "./admin-session";
import {
  approveConsent,
  authorizationQuery,
  connectClaude,
  mcpClientFor,
  pkcePair,
  registerClaude,
  registerClient,
  startConsent,
  toolJson,
} from "./mcp-session";
import { APP_URL, startTestPlatform, type TestPlatform } from "./test-platform";

const WRITE_TOOLS = [
  "create_prospect_company",
  "update_prospect_company",
  "change_prospect_stage",
  "add_prospect_note",
  "add_prospect_contact",
  "update_prospect_contact",
];

let platform: TestPlatform;
let admin: string;

const auditActions = async (action: string) =>
  (
    await platform.env.DB.prepare(
      "SELECT action, target_id AS targetId, data FROM audit_logs WHERE action = ?",
    )
      .bind(action)
      .all<{ action: string; targetId: string | null; data: string | null }>()
  ).results;

beforeAll(async () => {
  platform = await startTestPlatform();
  admin = await signInAsAdmin(platform, "quentin@passalio.com");
}, 60_000);

afterAll(async () => {
  await platform.dispose();
});

describe("discovery", () => {
  it("challenges a call without token and points to the resource metadata", async () => {
    const response = await platform.request("/mcp", { method: "POST", body: "{}" });
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain(
      `resource_metadata="${APP_URL}/.well-known/oauth-protected-resource/mcp"`,
    );
  });

  it("publishes the resource and authorization server metadata", async () => {
    const resource = await platform.request("/.well-known/oauth-protected-resource/mcp");
    expect(await resource.json()).toMatchObject({
      resource: `${APP_URL}/mcp`,
      authorization_servers: [APP_URL],
    });
    const server = await platform.workerRequest("/.well-known/oauth-authorization-server");
    expect(await server.json()).toMatchObject({
      issuer: APP_URL,
      authorization_endpoint: `${APP_URL}/admin/mcp/autoriser`,
      token_endpoint: `${APP_URL}/oauth/token`,
    });
  });

  it("refuses an invalid token", async () => {
    const response = await platform.request("/mcp", {
      method: "POST",
      body: "{}",
      headers: { authorization: "Bearer faux-jeton" },
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain('error="invalid_token"');
  });
});

describe("client registration", () => {
  it("refuses a redirect outside Claude and localhost", async () => {
    const response = await registerClient(platform, "https://pirate.example/callback");
    expect(response.status).toBe(400);
  });
});

describe("authorization", () => {
  it("describes the request to the admin", async () => {
    const clientId = await registerClaude(platform);
    const { challenge } = await pkcePair();
    const { consent } = await startConsent(
      platform,
      admin,
      authorizationQuery(clientId, challenge),
    );
    expect(consent).toMatchObject({ clientName: "Claude", redirectHost: "claude.ai" });
  });

  it("refuses a request without PKCE S256", async () => {
    const clientId = await registerClaude(platform);
    const response = await platform.request(
      `/api/admin/mcp/authorization?${authorizationQuery(clientId, "verificateur-en-clair", { code_challenge_method: "plain" })}`,
      {},
      admin,
    );
    expect(response.status).toBe(400);
  });

  it("refuses a sales person", async () => {
    const sales = await signInAsAdmin(platform, "antho@passalio.com", "sales");
    const clientId = await registerClaude(platform);
    const { challenge } = await pkcePair();
    const response = await platform.request(
      `/api/admin/mcp/authorization?${authorizationQuery(clientId, challenge)}`,
      {},
      sales,
    );
    expect(response.status).toBe(403);
  });

  it("hides the authorization from a person without platform role", async () => {
    const someone = await platform.signIn("artisan@exemple.fr");
    const response = await platform.request("/api/admin/mcp/authorization", {}, someone);
    expect(response.status).toBe(404);
  });

  it("refuses an approval from another browser", async () => {
    const clientId = await registerClaude(platform);
    const { challenge } = await pkcePair();
    const { consent } = await startConsent(
      platform,
      admin,
      authorizationQuery(clientId, challenge),
    );
    const response = await approveConsent(platform, admin, consent.handle, "write");
    expect(response.status).toBe(410);
  });

  it("sends a denial back to Claude with access_denied", async () => {
    const clientId = await registerClaude(platform);
    const { challenge } = await pkcePair();
    const { consent, cookie } = await startConsent(
      platform,
      admin,
      authorizationQuery(clientId, challenge),
    );
    const response = await platform.request(
      "/api/admin/mcp/authorization/denial",
      { method: "POST", body: JSON.stringify({ handle: consent.handle }) },
      cookie,
    );
    expect(response.status).toBe(200);
    const { redirectTo } = mcpRedirectResponse
      .pick({ redirectTo: true })
      .parse(await response.json());
    expect(new URL(redirectTo).searchParams.get("error")).toBe("access_denied");
  });

  it("writes the authorization in the journal", async () => {
    await connectClaude(platform, admin, "read");
    const entries = await auditActions("mcp.authorized");
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.at(-1)?.data).toContain("Claude");
  });
});

describe("tools", () => {
  it("gives only read tools to a read-only connection", async () => {
    const { access_token } = await connectClaude(platform, admin, "read");
    const client = mcpClientFor(platform, access_token);
    const names = await client.toolNames();
    expect(names).toContain("get_overview");
    expect(names).toContain("list_prospect_companies");
    expect(names.filter((name) => WRITE_TOOLS.includes(name))).toEqual([]);
  });

  it("creates, qualifies and notes a company, and journals each write", async () => {
    const { access_token } = await connectClaude(platform, admin, "write");
    const client = mcpClientFor(platform, access_token);
    const names = await client.toolNames();
    expect(names).toEqual(expect.arrayContaining(WRITE_TOOLS));

    const created = toolJson(
      await client.callTool("create_prospect_company", {
        name: "Ramonage Secret du Val",
        city: "Créteil",
        department: "94",
      }),
    );
    const company = prospectCompanyResponse.parse(created.value);
    const staged = toolJson(
      await client.callTool("change_prospect_stage", {
        companyId: company.id,
        stage: "qualified",
        note: "Rappeler lundi",
      }),
    );
    expect(staged.isError).toBe(false);
    const file = prospectCompanyFileResponse.parse(
      toolJson(await client.callTool("get_prospect_company", { companyId: company.id })).value,
    );
    expect(file.company.stage).toBe("qualified");

    expect(await auditActions("mcp.create_prospect_company")).toEqual([
      expect.objectContaining({ targetId: company.id }),
    ]);
    expect(await auditActions("mcp.change_prospect_stage")).toEqual([
      expect.objectContaining({ targetId: company.id }),
    ]);
    expect(platform.loggedLines().some((line) => line.includes("mcp_tool_called"))).toBe(true);
    expect(platform.loggedLines().some((line) => line.includes("Secret du Val"))).toBe(false);
  });

  it("answers an unknown company with an error result", async () => {
    const { access_token } = await connectClaude(platform, admin, "write");
    const client = mcpClientFor(platform, access_token);
    const result = toolJson(
      await client.callTool("add_prospect_note", { companyId: crypto.randomUUID(), body: "Note" }),
    );
    expect(result).toEqual({ isError: true, value: { error: "company_not_found" } });
  });

  it("stops answering once the platform role is removed", async () => {
    const marie = await signInAsAdmin(platform, "marie@passalio.com", "admin");
    const { access_token } = await connectClaude(platform, marie, "write");
    await grantPlatformRole(platform, "marie@passalio.com", "sales");
    const response = await platform.request("/mcp", {
      method: "POST",
      headers: {
        authorization: `Bearer ${access_token}`,
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    expect(response.status).toBe(403);
  });
});

describe("rate limit", () => {
  it("counts calls per person and per minute", async () => {
    const database = createDatabase(platform.env.DB);
    const now = new Date("2026-10-23T18:00:00Z");
    const answers = await Promise.all(
      Array.from({ length: MCP_CALLS_PER_MINUTE + 1 }, async () =>
        countMcpCall(database, "limite", now),
      ),
    );
    expect(answers.filter(Boolean)).toHaveLength(MCP_CALLS_PER_MINUTE);
    expect(answers.filter((answer) => !answer)).toHaveLength(1);
    expect(await countMcpCall(database, "limite", new Date(now.getTime() + 60_000))).toBe(true);
  });
});

describe("when the MCP is off", () => {
  it("answers 404 everywhere", async () => {
    const off = { ...platform.env, MCP_ENABLED: "false" };
    const { app } = await import("../src/app");
    expect((await app.request("/mcp", { method: "POST" }, off)).status).toBe(404);
    expect((await app.request("/.well-known/oauth-protected-resource/mcp", {}, off)).status).toBe(
      404,
    );
  });
});
