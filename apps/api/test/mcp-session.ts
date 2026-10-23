import {
  mcpAuthorizationResponse,
  mcpRedirectResponse,
  type McpAccessLevel,
} from "@passalio/shared";
import { expect } from "vitest";
import * as z from "zod";
import { APP_URL, type TestPlatform } from "./test-platform";

export const CLAUDE_REDIRECT_URI = "https://claude.ai/api/mcp/auth_callback";
export const MCP_RESOURCE = `${APP_URL}/mcp`;

const registeredClient = z.object({ client_id: z.string() });
const tokenResponse = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  scope: z.string(),
});

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

export const pkcePair = async () => {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
};

export const registerClient = async (
  platform: TestPlatform,
  redirectUri: string = CLAUDE_REDIRECT_URI,
) =>
  platform.workerRequest("/oauth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Claude",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });

export const registerClaude = async (platform: TestPlatform) => {
  const response = await registerClient(platform);
  expect(response.status).toBe(201);
  return registeredClient.parse(await response.json()).client_id;
};

export const authorizationQuery = (
  clientId: string,
  challenge: string,
  overrides: Readonly<Record<string, string>> = {},
) =>
  new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: CLAUDE_REDIRECT_URI,
    state: "etat-claude",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: MCP_RESOURCE,
    ...overrides,
  }).toString();

const cookiePairsOf = (response: Response) =>
  response.headers.getSetCookie().map((cookie) => cookie.split(";")[0] ?? "");

export const startConsent = async (platform: TestPlatform, cookie: string, query: string) => {
  const response = await platform.request(`/api/admin/mcp/authorization?${query}`, {}, cookie);
  expect(response.status).toBe(200);
  const consent = mcpAuthorizationResponse.parse(await response.json());
  return { consent, cookie: [cookie, ...cookiePairsOf(response)].join("; ") };
};

export const approveConsent = async (
  platform: TestPlatform,
  cookie: string,
  handle: string,
  access: McpAccessLevel,
) =>
  platform.request(
    "/api/admin/mcp/authorization",
    { method: "POST", body: JSON.stringify({ handle, access }) },
    cookie,
  );

export const exchangeCode = async (
  platform: TestPlatform,
  clientId: string,
  redirectTo: string,
  verifier: string,
) => {
  const code = new URL(redirectTo).searchParams.get("code") ?? "";
  const response = await platform.workerRequest("/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: CLAUDE_REDIRECT_URI,
      client_id: clientId,
      code_verifier: verifier,
      resource: MCP_RESOURCE,
    }).toString(),
  });
  expect(response.status).toBe(200);
  return tokenResponse.parse(await response.json());
};

export const connectClaude = async (
  platform: TestPlatform,
  adminCookie: string,
  access: McpAccessLevel,
) => {
  const clientId = await registerClaude(platform);
  const { verifier, challenge } = await pkcePair();
  const { consent, cookie } = await startConsent(
    platform,
    adminCookie,
    authorizationQuery(clientId, challenge),
  );
  const approved = await approveConsent(platform, cookie, consent.handle, access);
  expect(approved.status).toBe(200);
  const { redirectTo } = mcpRedirectResponse.parse(await approved.json());
  return exchangeCode(platform, clientId, redirectTo, verifier);
};

const jsonRpcResponse = z.object({ result: z.unknown().optional(), error: z.unknown().optional() });

const serverInitialization = z.object({
  serverInfo: z.object({
    name: z.string(),
    title: z.string().optional(),
    icons: z
      .array(
        z.object({
          src: z.string(),
          mimeType: z.string().optional(),
          sizes: z.array(z.string()).optional(),
        }),
      )
      .optional(),
  }),
});

const toolList = z.object({ tools: z.array(z.object({ name: z.string() })) });

export const mcpClientFor = (platform: TestPlatform, accessToken: string) => {
  const call = async (method: string, params: Record<string, unknown> = {}) => {
    const response = await platform.request("/mcp", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    expect(response.status).toBe(200);
    return jsonRpcResponse.parse(await response.json()).result;
  };
  return {
    initialize: async () =>
      serverInitialization.parse(
        await call("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "claude-test", version: "1.0.0" },
        }),
      ),
    toolNames: async () => toolList.parse(await call("tools/list")).tools.map((tool) => tool.name),
    callTool: async (name: string, toolArguments: Record<string, unknown>) =>
      call("tools/call", { name, arguments: toolArguments }),
  };
};

const textContent = z.object({
  content: z.array(z.object({ type: z.literal("text"), text: z.string() })),
  isError: z.boolean().optional(),
});

export const toolJson = (result: unknown) => {
  const parsed = textContent.parse(result);
  const [first] = parsed.content;
  return { isError: parsed.isError === true, value: JSON.parse(first?.text ?? "null") };
};
