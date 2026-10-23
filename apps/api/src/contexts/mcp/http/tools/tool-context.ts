import { ForbiddenError, type PlatformActor } from "@passalio/shared";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { AuditTrail } from "../../../../platform/audit-trail";
import type { Database } from "../../../../platform/database";
import type { Logger } from "../../../../platform/logger";
import type { McpToolName } from "./tools-fr";

export type McpToolContext = {
  readonly actor: PlatformActor;
  readonly database: Database;
  readonly auditTrail: AuditTrail;
  readonly logger: Logger;
};

export const jsonResult = (value: unknown): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(value) }],
});

export const errorResult = (error: string): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify({ error }) }],
  isError: true,
});

export const runTool = async (
  context: McpToolContext,
  tool: McpToolName,
  run: () => Promise<CallToolResult>,
): Promise<CallToolResult> => {
  const startedAt = Date.now();
  try {
    const result = await run();
    context.logger.info({
      event: "mcp_tool_called",
      tool,
      isError: result.isError === true,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    if (error instanceof ForbiddenError) {
      context.logger.warn({ event: "mcp_tool_forbidden", tool, permission: error.permission });
      return errorResult("forbidden");
    }
    throw error;
  }
};
