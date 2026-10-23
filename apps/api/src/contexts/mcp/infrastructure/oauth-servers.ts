import { OAuthAuthorizationServer } from "@cloudflare/workers-oauth-provider";
import { MCP_GRANT_DAYS, MCP_SCOPES } from "@passalio/shared";
import { isAllowedRedirectUri } from "../domain/redirect-policy";

export type OAuthStore = { readonly OAUTH_KV: KVNamespace };

export const MCP_PATH = "/mcp";
export const PROTECTED_RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource";
export const AUTHORIZATION_SERVER_METADATA_PATH = "/.well-known/oauth-authorization-server";
export const AUTHORIZE_PATH = "/admin/mcp/autoriser";
export const TOKEN_PATH = "/oauth/token";
export const REGISTER_PATH = "/oauth/register";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const GRANT_TTL_SECONDS = MCP_GRANT_DAYS * 24 * 60 * 60;

const redirectUrisOf = (metadata: Record<string, unknown>): unknown[] => {
  const uris = metadata["redirect_uris"];
  return Array.isArray(uris) ? uris : [];
};

const hasOnlyAllowedRedirects = (metadata: Record<string, unknown>) => {
  const uris = redirectUrisOf(metadata);
  return (
    uris.length > 0 && uris.every((uri) => typeof uri === "string" && isAllowedRedirectUri(uri))
  );
};

const authorizationServers = new Map<string, OAuthAuthorizationServer<OAuthStore>>();

export const mcpResourceOf = (appUrl: string) => `${appUrl}${MCP_PATH}`;

export const authorizationServerFor = (appUrl: string): OAuthAuthorizationServer<OAuthStore> => {
  const known = authorizationServers.get(appUrl);
  if (known !== undefined) {
    return known;
  }
  const server = new OAuthAuthorizationServer<OAuthStore>({
    issuer: appUrl,
    authorizeEndpoint: `${appUrl}${AUTHORIZE_PATH}`,
    tokenEndpoint: `${appUrl}${TOKEN_PATH}`,
    clientRegistrationEndpoint: `${appUrl}${REGISTER_PATH}`,
    resources: [mcpResourceOf(appUrl)],
    defaultResource: mcpResourceOf(appUrl),
    scopesSupported: [MCP_SCOPES.read, MCP_SCOPES.write],
    accessTokenTTL: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTTL: GRANT_TTL_SECONDS,
    clientRegistrationCallback: ({ clientMetadata }) =>
      hasOnlyAllowedRedirects(clientMetadata)
        ? undefined
        : { code: "invalid_redirect_uri", description: "Redirect URI not allowed" },
  });
  authorizationServers.set(appUrl, server);
  return server;
};
