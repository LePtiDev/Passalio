import { mcpApprovalBody, mcpDenialBody } from "@passalio/shared";
import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { validateJson } from "../../../platform/validation";
import { requirePlatformActor, type PlatformEnv } from "../../backoffice";
import { approveAuthorization } from "../application/approve-authorization";
import { denyAuthorization } from "../application/deny-authorization";
import { startAuthorization } from "../application/start-authorization";
import type { AuthorizationError } from "../domain/authorization-ports";
import { createOAuthAuthorizationGateway } from "../infrastructure/oauth-authorization-gateway";
import { authorizationServerFor } from "../infrastructure/oauth-servers";
import { oauthStoreOf } from "../infrastructure/oauth-store";
import { withHeaders } from "./response-headers";

const ERROR_STATUS: Readonly<Record<AuthorizationError, ContentfulStatusCode>> = {
  authorization_invalid: 400,
  authorization_expired: 410,
  redirect_not_allowed: 400,
  pkce_required: 400,
};

const errorResponse = (context: Context<PlatformEnv>, error: AuthorizationError) => {
  context.get("logger").warn({ event: "mcp_authorization_refused", reason: error });
  return context.json({ error, traceId: context.get("traceId") }, ERROR_STATUS[error]);
};

const gatewayOf = (context: Context<PlatformEnv>) => {
  const store = oauthStoreOf(context.env);
  if (store === null) {
    return null;
  }
  const helpers = authorizationServerFor(context.env.APP_URL).getOAuthApi(store);
  return createOAuthAuthorizationGateway(helpers, context.req.raw, context.env.APP_URL);
};

const notFound = (context: Context<PlatformEnv>) =>
  context.json({ error: "not_found", traceId: context.get("traceId") }, 404);

export const authorizationRoutes = new Hono<PlatformEnv>()
  .use(requirePlatformActor)
  .get("/", async (context) => {
    const gateway = gatewayOf(context);
    if (gateway === null) {
      return notFound(context);
    }
    const result = await startAuthorization(gateway)(context.var.platformActor);
    if (!result.isOk) {
      return errorResponse(context, result.error);
    }
    const { pending, consent } = result.value;
    return withHeaders(
      context.json({
        handle: consent.handle,
        clientName: pending.clientName,
        redirectHost: pending.redirectHost,
        isLoopback: pending.isLoopback,
      }),
      consent.headers,
    );
  })
  .post("/", validateJson(mcpApprovalBody), async (context) => {
    const gateway = gatewayOf(context);
    if (gateway === null) {
      return notFound(context);
    }
    const { handle, access } = context.req.valid("json");
    const result = await approveAuthorization({
      gateway,
      audit: {
        authorized: async (actorUserId, clientName, grantedAccess) =>
          context.var.auditTrail.record({
            organizationId: null,
            actorUserId,
            action: "mcp.authorized",
            targetType: "user",
            targetId: actorUserId,
            data: { client: clientName, access: grantedAccess },
          }),
      },
      now: () => new Date(),
    })(context.var.platformActor, handle, access);
    if (!result.isOk) {
      return errorResponse(context, result.error);
    }
    context.get("logger").info({ event: "mcp_authorized", access });
    return withHeaders(
      context.json({
        redirectTo: result.value.redirectTo,
        expiresAt: result.value.expiresAt.toISOString(),
      }),
      result.value.headers,
    );
  })
  .post("/denial", validateJson(mcpDenialBody), async (context) => {
    const gateway = gatewayOf(context);
    if (gateway === null) {
      return notFound(context);
    }
    const result = await denyAuthorization(gateway)(
      context.var.platformActor,
      context.req.valid("json").handle,
    );
    if (!result.isOk) {
      return errorResponse(context, result.error);
    }
    const { redirectTo, headers } = result.value;
    headers.delete("location");
    return withHeaders(context.json({ redirectTo }), headers);
  });
