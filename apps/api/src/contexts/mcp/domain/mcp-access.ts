import {
  canPlatform,
  err,
  isPlatformRole,
  MCP_SCOPES,
  ok,
  type McpAccessLevel,
  type PlatformActor,
  type Result,
} from "@passalio/shared";

export type McpCaller = {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly role: string | null;
  readonly isBanned: boolean;
};

export type McpAccessDenial = "not_admin";

export const actorOfMcpCaller = (
  caller: McpCaller | undefined,
): Result<PlatformActor, McpAccessDenial> => {
  if (caller === undefined || caller.isBanned || !isPlatformRole(caller.role)) {
    return err("not_admin");
  }
  const actor = {
    userId: caller.userId,
    email: caller.email,
    name: caller.name,
    role: caller.role,
  };
  return canPlatform(actor, "mcp:connect") ? ok(actor) : err("not_admin");
};

export const scopesOfAccess = (access: McpAccessLevel): string[] =>
  access === "write" ? [MCP_SCOPES.read, MCP_SCOPES.write] : [MCP_SCOPES.read];

export const accessOfScopes = (scopes: readonly string[]): McpAccessLevel | null => {
  if (scopes.includes(MCP_SCOPES.write)) {
    return "write";
  }
  return scopes.includes(MCP_SCOPES.read) ? "read" : null;
};
