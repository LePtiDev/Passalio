import * as z from "zod";

export const MCP_ACCESS_LEVELS = ["read", "write"] as const;

export type McpAccessLevel = (typeof MCP_ACCESS_LEVELS)[number];

export const MCP_SCOPES = {
  read: "passalio:read",
  write: "passalio:write",
} as const satisfies Record<McpAccessLevel, string>;

export const MCP_GRANT_DAYS = 7;

export const mcpAuthorizationResponse = z.object({
  handle: z.string(),
  clientName: z.string(),
  redirectHost: z.string(),
  isLoopback: z.boolean(),
});

export type McpAuthorizationResponse = z.infer<typeof mcpAuthorizationResponse>;

export const mcpApprovalBody = z.object({
  handle: z.string().min(1).max(200),
  access: z.enum(MCP_ACCESS_LEVELS),
});

export type McpApprovalBody = z.infer<typeof mcpApprovalBody>;

export const mcpDenialBody = mcpApprovalBody.pick({ handle: true });

export type McpDenialBody = z.infer<typeof mcpDenialBody>;

export const mcpRedirectResponse = z.object({
  redirectTo: z.url(),
  expiresAt: z.iso.datetime(),
});

export type McpRedirectResponse = z.infer<typeof mcpRedirectResponse>;
