import { Hono } from "hono";
import type { AppEnv } from "../../../env";
import { validateParam } from "../../../platform/validation";
import { acceptTeamInvitation, getTeamInvitation } from "../application/join-team";
import { createTeamDependencies } from "../infrastructure/team-dependencies";
import { teamErrorResponse } from "./team-error-response";
import { teamInvitationParams } from "./team-schemas";

const dependencies = (context: { var: AppEnv["Variables"]; env: AppEnv["Bindings"] }) =>
  createTeamDependencies({
    database: context.var.database,
    auditTrail: context.var.auditTrail,
    emailSender: context.var.emailSender,
    appUrl: context.env.APP_URL,
  });

export const teamInvitationRoutes = new Hono<AppEnv>()
  .use(async (context, next) =>
    context.get("session") === null
      ? context.json({ error: "unauthenticated", traceId: context.get("traceId") }, 401)
      : next(),
  )
  .get("/:invitationId", validateParam(teamInvitationParams), async (context) => {
    const result = await getTeamInvitation(dependencies(context))(
      context.req.valid("param").invitationId,
    );
    return result.isOk
      ? context.json({ invitation: result.value })
      : teamErrorResponse(context, result.error);
  })
  .post("/:invitationId/accept", validateParam(teamInvitationParams), async (context) => {
    const session = context.get("session");
    if (session === null) {
      return context.json({ error: "unauthenticated", traceId: context.get("traceId") }, 401);
    }
    const result = await acceptTeamInvitation(dependencies(context))(
      { userId: session.user.id, email: session.user.email },
      context.req.valid("param").invitationId,
    );
    return result.isOk
      ? context.json({ member: { role: result.value } })
      : teamErrorResponse(context, result.error);
  });
