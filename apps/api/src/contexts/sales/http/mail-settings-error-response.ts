import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { MailSettingsError } from "../domain/mail-settings-error";

const ERROR_STATUS: Readonly<Record<MailSettingsError, ContentfulStatusCode>> = {
  member_not_found: 404,
  password_required: 422,
  mailbox_not_configured: 409,
  smtp_auth_failed: 422,
  smtp_unreachable: 422,
  smtp_refused: 422,
};

export const mailSettingsErrorResponse = (context: Context, error: MailSettingsError) =>
  context.json({ error, traceId: context.get("traceId") }, ERROR_STATUS[error]);
