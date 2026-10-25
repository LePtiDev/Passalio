import { app } from "./app";
import { isAuthorizationServerRequest, serveAuthorizationServer } from "./contexts/mcp";
import type { Bindings } from "./env";
import { handleScheduled } from "./jobs/scheduled";

export const handleRequest = async (
  request: Request,
  env: Bindings,
  executionContext: ExecutionContext,
): Promise<Response> =>
  isAuthorizationServerRequest(request)
    ? serveAuthorizationServer(request, env, executionContext)
    : app.fetch(request, env, executionContext);

const worker: ExportedHandler<Bindings> = { fetch: handleRequest, scheduled: handleScheduled };

export default worker;
