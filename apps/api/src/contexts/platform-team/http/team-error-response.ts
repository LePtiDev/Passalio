import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { TeamError } from "../domain/team-error";

const ERROR_STATUS: Readonly<Record<TeamError, ContentfulStatusCode>> = {
  already_in_team: 409,
  teammate_not_found: 404,
  cannot_change_own_role: 409,
  invitation_not_found: 404,
  invitation_expired: 410,
  invitation_email_mismatch: 403,
};

export const teamErrorResponse = (context: Context, error: TeamError) =>
  context.json({ error, traceId: context.get("traceId") }, ERROR_STATUS[error]);
