import type { Bindings } from "../../../env";
import type { OAuthStore } from "./oauth-servers";

export const oauthStoreOf = (env: Bindings): OAuthStore | null =>
  env.MCP_ENABLED === "true" && env.OAUTH_KV !== undefined ? { OAUTH_KV: env.OAUTH_KV } : null;
