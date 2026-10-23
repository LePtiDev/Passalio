import type { Bindings } from "../../../env";
import { createLogger } from "../../../platform/logger";
import { newTraceId, TRACE_HEADER } from "../../../platform/trace";
import {
  AUTHORIZATION_SERVER_METADATA_PATH,
  authorizationServerFor,
  REGISTER_PATH,
  TOKEN_PATH,
} from "../infrastructure/oauth-servers";
import { oauthStoreOf } from "../infrastructure/oauth-store";

const AUTHORIZATION_SERVER_PATHS: ReadonlySet<string> = new Set([
  AUTHORIZATION_SERVER_METADATA_PATH,
  TOKEN_PATH,
  REGISTER_PATH,
]);

export const isAuthorizationServerRequest = (request: Request) =>
  AUTHORIZATION_SERVER_PATHS.has(new URL(request.url).pathname);

export const serveAuthorizationServer = async (
  request: Request,
  env: Bindings,
  executionContext: ExecutionContext,
): Promise<Response> => {
  const traceId = newTraceId();
  const store = oauthStoreOf(env);
  if (store === null) {
    return Response.json({ error: "not_found", traceId }, { status: 404 });
  }
  const served = await authorizationServerFor(env.APP_URL).fetch(request, store, executionContext);
  const response = new Response(served.body, served);
  response.headers.set(TRACE_HEADER, traceId);
  const pathname = new URL(request.url).pathname;
  if (response.status >= 400) {
    createLogger(traceId).warn({
      event: "oauth_rejected",
      path: pathname,
      status: response.status,
    });
  }
  return response;
};
