import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { canPlatform, type McpAccessLevel } from "@passalio/shared";
import { registerAdminTools } from "./admin-tools";
import { registerProspectReadTools } from "./prospect-read-tools";
import { registerProspectWriteTools } from "./prospect-write-tools";
import type { McpToolContext } from "./tool-context";
import { toolsFr } from "./tools-fr";

const serverInfoOf = (appUrl: string) => ({
  name: "passalio-admin",
  title: "Passalio",
  version: "1.0.0",
  websiteUrl: appUrl,
  icons: [{ src: `${appUrl}/icon-192.png`, mimeType: "image/png", sizes: ["192x192"] }],
});

export const createPassalioMcpServer = (
  context: McpToolContext,
  access: McpAccessLevel,
  appUrl: string,
) => {
  const server = new McpServer(serverInfoOf(appUrl), {
    instructions: toolsFr.serverInstructions,
  });
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
