import {
  assertPlatformCan,
  err,
  MCP_GRANT_DAYS,
  ok,
  type McpAccessLevel,
  type PlatformActor,
  type Result,
} from "@passalio/shared";
import { scopesOfAccess } from "../domain/mcp-access";
import type {
  AuthorizationAudit,
  AuthorizationError,
  AuthorizationGateway,
} from "../domain/authorization-ports";
import { isAllowedRedirectUri } from "../domain/redirect-policy";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ApprovalDependencies = {
  readonly gateway: AuthorizationGateway;
  readonly audit: AuthorizationAudit;
  readonly now: () => Date;
};

export type GrantedAuthorization = {
  readonly redirectTo: string;
  readonly expiresAt: Date;
  readonly headers: Headers;
};

export const approveAuthorization =
  ({ gateway, audit, now }: ApprovalDependencies) =>
  async (
    actor: PlatformActor,
    handle: string,
    access: McpAccessLevel,
  ): Promise<Result<GrantedAuthorization, AuthorizationError>> => {
    assertPlatformCan(actor, "mcp:connect");
    const approved = await gateway.approve(handle, scopesOfAccess(access));
    if (approved === null) {
      return err("authorization_expired");
    }
    if (!isAllowedRedirectUri(approved.redirectUri)) {
      return err("redirect_not_allowed");
    }
    const redirectTo = await approved.complete(actor.userId);
    await audit.authorized(actor.userId, approved.clientName, access);
    return ok({
      redirectTo,
      expiresAt: new Date(now().getTime() + MCP_GRANT_DAYS * DAY_MS),
      headers: approved.headers,
    });
  };
