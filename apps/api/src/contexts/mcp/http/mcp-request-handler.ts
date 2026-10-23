import type { ValidatedAccessToken } from "@cloudflare/workers-oauth-provider";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Context } from "hono";
import type { AppEnv } from "../../../env";
import { createAuditTrail } from "../../../platform/audit-trail";
import { createDatabase } from "../../../platform/database";
import { accessOfScopes, actorOfMcpCaller } from "../domain/mcp-access";
import { findMcpCaller } from "../infrastructure/mcp-caller-repository";
import { countMcpCall } from "../infrastructure/mcp-rate-limit";
import { createPassalioMcpServer } from "./tools/mcp-server";

const RETRY_AFTER_SECONDS = "60";

export const handleMcpRequest = async (
  context: Context<AppEnv>,
  token: ValidatedAccessToken,
): Promise<Response> => {
  const logger = context.get("logger");
  const traceId = context.get("traceId");
  const access = accessOfScopes(token.scope);
  const database = createDatabase(context.env.DB);
  const caller = await findMcpCaller(database, token.userId);
  const actor = actorOfMcpCaller(caller);
  if (access === null || !actor.isOk) {
    logger.warn({ event: "mcp_access_denied" });
    return Response.json({ error: "forbidden", traceId }, { status: 403 });
  }
  if (!(await countMcpCall(database, actor.value.userId, new Date()))) {
    logger.warn({ event: "mcp_rate_limited" });
    return Response.json(
      { error: "rate_limited", traceId },
      { status: 429, headers: { "retry-after": RETRY_AFTER_SECONDS } },
    );
  }
  const server = createPassalioMcpServer(
    {
      actor: actor.value,
      database,
      auditTrail: createAuditTrail(database, traceId),
      logger,
    },
    access,
  );
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(context.req.raw);
};
