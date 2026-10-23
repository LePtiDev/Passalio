import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { canPlatform, type McpAccessLevel } from "@passalio/shared";
import { registerAdminTools } from "./admin-tools";
import { registerProspectReadTools } from "./prospect-read-tools";
import { registerProspectWriteTools } from "./prospect-write-tools";
import type { McpToolContext } from "./tool-context";
import { toolsFr } from "./tools-fr";

const SERVER_INFO = { name: "passalio-admin", version: "1.0.0" };

export const createPassalioMcpServer = (context: McpToolContext, access: McpAccessLevel) => {
  const server = new McpServer(SERVER_INFO, { instructions: toolsFr.serverInstructions });
  if (canPlatform(context.actor, "platform:read")) {
    registerAdminTools(server, context);
  }
  if (canPlatform(context.actor, "prospects:read")) {
    registerProspectReadTools(server, context);
  }
  if (access === "write" && canPlatform(context.actor, "prospects:write")) {
    registerProspectWriteTools(server, context);
  }
  return server;
};
