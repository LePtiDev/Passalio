import { Hono } from "hono";
import { validateJson, validateParam, validateQuery } from "../../../platform/validation";
import { acceptInvitation } from "../application/accept-invitation";
import { cancelInvitation } from "../application/cancel-invitation";
import { changeMemberRole } from "../application/change-member-role";
import { createOrganization } from "../application/create-organization";
import { inviteMember } from "../application/invite-member";
import { listMembers } from "../application/list-members";
import { listPendingInvitations } from "../application/list-pending-invitations";
import { removeMember } from "../application/remove-member";
import { resendInvitation } from "../application/resend-invitation";
import { transferOwnership } from "../application/transfer-ownership";
import { identityDependencies } from "./identity-context";
import { identityErrorResponse } from "./identity-responses";
import {
  changeMemberRoleBody,
  createOrganizationBody,
  invitationParams,
  inviteMemberBody,
  listMembersQuery,
  memberParams,
  pendingInvitationParams,
  transferOwnershipBody,
} from "./identity-schemas";
import { requireActor, requireUser, type ActorEnv, type UserEnv } from "./require-actor";

const userRoutes = new Hono<UserEnv>()
  .use(requireUser)
  .post("/organizations", validateJson(createOrganizationBody), async (context) => {
    const result = await createOrganization(identityDependencies(context.var, context.env))(
      context.get("userActor"),
      context.req.valid("json"),
    );
    return result.isOk
      ? context.json({ organization: result.value }, 201)
      : identityErrorResponse(context, result.error, context.get("traceId"));
  })
  .post(
    "/invitations/:organizationId/:invitationId/accept",
    validateParam(invitationParams),
    async (context) => {
      const result = await acceptInvitation(identityDependencies(context.var, context.env))(
        context.get("userActor"),
        context.req.valid("param"),
      );
      return result.isOk
        ? context.json({ member: result.value }, 201)
        : identityErrorResponse(context, result.error, context.get("traceId"));
    },
  );

const memberRoutes = new Hono<ActorEnv>()
  .use(requireActor)
  .get("/me", (context) => context.json({ actor: context.get("actor") }))
  .get("/members", validateQuery(listMembersQuery), async (context) => {
    const { cursor } = context.req.valid("query");
    const page = await listMembers(identityDependencies(context.var, context.env))(
      context.get("actor"),
      cursor === undefined ? {} : { afterId: cursor },
    );
    return context.json(page);
  })
  .post("/invitations", validateJson(inviteMemberBody), async (context) => {
    const result = await inviteMember(identityDependencies(context.var, context.env))(
      context.get("actor"),
      context.req.valid("json"),
    );
    return result.isOk
      ? context.json({ invitation: { id: result.value.id, role: result.value.role } }, 201)
      : identityErrorResponse(context, result.error, context.get("traceId"));
  })
  .get("/invitations", validateQuery(listMembersQuery), async (context) => {
    const { cursor } = context.req.valid("query");
    const page = await listPendingInvitations(identityDependencies(context.var, context.env))(
      context.get("actor"),
      cursor === undefined ? {} : { afterId: cursor },
    );
    return context.json(page);
  })
  .post(
    "/invitations/:invitationId/resend",
    validateParam(pendingInvitationParams),
    async (context) => {
      const result = await resendInvitation(identityDependencies(context.var, context.env))(
        context.get("actor"),
        context.req.valid("param"),
      );
      return result.isOk
        ? context.json({ invitation: { expiresAt: result.value } })
        : identityErrorResponse(context, result.error, context.get("traceId"));
    },
  )
  .delete("/invitations/:invitationId", validateParam(pendingInvitationParams), async (context) => {
    const result = await cancelInvitation(identityDependencies(context.var, context.env))(
      context.get("actor"),
      context.req.valid("param"),
    );
    return result.isOk
      ? context.body(null, 204)
      : identityErrorResponse(context, result.error, context.get("traceId"));
  })
  .patch(
    "/members/:memberId",
    validateParam(memberParams),
    validateJson(changeMemberRoleBody),
    async (context) => {
      const result = await changeMemberRole(identityDependencies(context.var, context.env))(
        context.get("actor"),
        {
          ...context.req.valid("param"),
          ...context.req.valid("json"),
        },
      );
      return result.isOk
        ? context.body(null, 204)
        : identityErrorResponse(context, result.error, context.get("traceId"));
    },
  )
  .delete("/members/:memberId", validateParam(memberParams), async (context) => {
    const result = await removeMember(identityDependencies(context.var, context.env))(
      context.get("actor"),
      context.req.valid("param"),
    );
    return result.isOk
      ? context.body(null, 204)
      : identityErrorResponse(context, result.error, context.get("traceId"));
  })
  .post("/ownership-transfer", validateJson(transferOwnershipBody), async (context) => {
    const result = await transferOwnership(identityDependencies(context.var, context.env))(
      context.get("actor"),
      context.req.valid("json"),
    );
    return result.isOk
      ? context.body(null, 204)
      : identityErrorResponse(context, result.error, context.get("traceId"));
  });

export const identityRoutes = { userRoutes, memberRoutes };
