import { MCP_SCOPES } from "@passalio/shared";
import { Hono, type Context } from "hono";
import type { AppEnv } from "../../../env";
import {
  authorizationServerFor,
  MCP_PATH,
  mcpResourceOf,
  PROTECTED_RESOURCE_METADATA_PATH,
} from "../infrastructure/oauth-servers";
import { oauthStoreOf } from "../infrastructure/oauth-store";
import { handleMcpRequest } from "./mcp-request-handler";

const BEARER_PREFIX = "Bearer ";

const bearerTokenOf = (header: string | undefined) =>
  header?.startsWith(BEARER_PREFIX) === true ? header.slice(BEARER_PREFIX.length).trim() : "";

const metadataUrlOf = (appUrl: string) => `${appUrl}${PROTECTED_RESOURCE_METADATA_PATH}${MCP_PATH}`;

const challenge = (context: Context<AppEnv>, hasToken: boolean) => {
  const error = hasToken ? 'error="invalid_token", ' : "";
  context.header(
    "www-authenticate",
    `Bearer ${error}resource_metadata="${metadataUrlOf(context.env.APP_URL)}"`,
  );
  return context.json({ error: "unauthorized", traceId: context.get("traceId") }, 401);
};

const notFound = (context: Context<AppEnv>) =>
  context.json({ error: "not_found", traceId: context.get("traceId") }, 404);

const protectedResourceMetadata = (context: Context<AppEnv>) =>
  oauthStoreOf(context.env) === null
    ? notFound(context)
    : context.json({
        resource: mcpResourceOf(context.env.APP_URL),
        authorization_servers: [context.env.APP_URL],
        scopes_supported: [MCP_SCOPES.read, MCP_SCOPES.write],
        bearer_methods_supported: ["header"],
        resource_name: "Passalio",
      });

export const mcpRoutes = new Hono<AppEnv>()
  .get(PROTECTED_RESOURCE_METADATA_PATH, protectedResourceMetadata)
  .get(`${PROTECTED_RESOURCE_METADATA_PATH}${MCP_PATH}`, protectedResourceMetadata)
  .all(MCP_PATH, async (context) => {
    const store = oauthStoreOf(context.env);
    if (store === null) {
      return notFound(context);
    }
    const token = bearerTokenOf(context.req.header("authorization"));
    if (token === "") {
      return challenge(context, false);
    }
    const appUrl = context.env.APP_URL;
    const validated = await authorizationServerFor(appUrl).validateToken(
      mcpResourceOf(appUrl),
      token,
      store,
    );
    if (validated === null) {
      return challenge(context, true);
    }
    return handleMcpRequest(context, validated);
  });
