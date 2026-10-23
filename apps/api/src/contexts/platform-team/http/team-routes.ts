import { changeTeammateRoleBody, inviteTeammateBody } from "@passalio/shared";
import { Hono } from "hono";
import { validateJson, validateParam } from "../../../platform/validation";
import { requirePlatformActor, type PlatformEnv } from "../../backoffice";
import { inviteTeammate } from "../application/invite-teammate";
import { listTeam } from "../application/list-team";
import { cancelTeamInvitation, resendTeamInvitation } from "../application/manage-team-invitation";
import { changeTeammateRole, removeTeammate } from "../application/manage-teammate";
import { createTeamDependencies } from "../infrastructure/team-dependencies";
import { teamErrorResponse } from "./team-error-response";
import { teamInvitationParams, teammateParams } from "./team-schemas";
import { teamPageResponse } from "./team-serializers";

const dependencies = (context: { var: PlatformEnv["Variables"]; env: PlatformEnv["Bindings"] }) =>
  createTeamDependencies({
    database: context.var.database,
    auditTrail: context.var.auditTrail,
    emailSender: context.var.emailSender,
    appUrl: context.env.APP_URL,
  });

export const teamRoutes = new Hono<PlatformEnv>()
  .use(requirePlatformActor)
  .get("/", async (context) =>
    context.json(
      teamPageResponse(await listTeam(dependencies(context))(context.var.platformActor)),
    ),
  )
  .post("/invitations", validateJson(inviteTeammateBody), async (context) => {
    const result = await inviteTeammate(dependencies(context))(
      context.var.platformActor,
      context.req.valid("json"),
    );
    return result.isOk
      ? context.json({ invitation: { id: result.value.id, role: result.value.role } }, 201)
      : teamErrorResponse(context, result.error);
  })
  .post(
    "/invitations/:invitationId/resend",
    validateParam(teamInvitationParams),
    async (context) => {
      const result = await resendTeamInvitation(dependencies(context))(
        context.var.platformActor,
        context.req.valid("param").invitationId,
      );
      return result.isOk
        ? context.json({ invitation: { expiresAt: result.value.toISOString() } })
        : teamErrorResponse(context, result.error);
    },
  )
  .delete("/invitations/:invitationId", validateParam(teamInvitationParams), async (context) => {
    const result = await cancelTeamInvitation(dependencies(context))(
      context.var.platformActor,
      context.req.valid("param").invitationId,
    );
    return result.isOk ? context.body(null, 204) : teamErrorResponse(context, result.error);
  })
  .patch(
    "/members/:userId",
    validateParam(teammateParams),
    validateJson(changeTeammateRoleBody),
    async (context) => {
      const result = await changeTeammateRole(dependencies(context))(context.var.platformActor, {
        userId: context.req.valid("param").userId,
        role: context.req.valid("json").role,
      });
      return result.isOk
        ? context.json({ member: { role: result.value } })
        : teamErrorResponse(context, result.error);
    },
  )
  .delete("/members/:userId", validateParam(teammateParams), async (context) => {
    const result = await removeTeammate(dependencies(context))(
      context.var.platformActor,
      context.req.valid("param").userId,
    );
    return result.isOk ? context.body(null, 204) : teamErrorResponse(context, result.error);
  });
