import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { IdentityError } from "../domain/identity-error";

const ERROR_STATUS: Readonly<Record<IdentityError, ContentfulStatusCode>> = {
  invalid_organization_name: 422,
  organization_not_found: 404,
  member_not_found: 404,
  already_member: 409,
  owner_role_not_assignable: 422,
  owner_cannot_be_changed: 409,
  transfer_target_not_admin: 422,
  invitation_not_found: 404,
  invitation_expired: 410,
  invitation_email_mismatch: 403,
  impersonation_read_only: 403,
};

export const identityErrorResponse = (context: Context, error: IdentityError, traceId: string) =>
  context.json({ error, traceId }, ERROR_STATUS[error]);
