import {
  invitationEmail,
  magicLinkEmail,
  mailSettingsChangedEmail,
  passwordResetEmail,
  prospectReminderEmail,
  teamInvitationEmail,
  type RenderedEmail,
} from "@passalio/emails";
import { z } from "zod";
import type { EmailSender } from "./email";
import type { Logger } from "./logger";

export const RESEND_EMAILS_URL = "https://api.resend.com/emails";

export type ResendSettings = {
  readonly apiKey: string;
  readonly from: string;
  readonly assetsUrl: string;
};

type EmailKind =
  | "magic_link"
  | "password_reset"
  | "invitation"
  | "team_invitation"
  | "mail_settings_changed"
  | "prospect_reminder";

const resendResponseSchema = z.object({ id: z.string() });

export class EmailDeliveryFailedError extends Error {
  constructor(kind: EmailKind, status: number) {
    super(`Resend refused the ${kind} email with status ${status}`);
    this.name = "EmailDeliveryFailedError";
  }
}

export const createResendEmailSender = (
  { apiKey, from, assetsUrl }: ResendSettings,
  logger: Logger,
  fetcher: typeof fetch = fetch,
): EmailSender => {
  const send = async (kind: EmailKind, to: string, email: RenderedEmail) => {
    const response = await fetcher(RESEND_EMAILS_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        tags: [{ name: "kind", value: kind }],
      }),
    });
    if (!response.ok) {
      logger.error({ event: "email_failed", kind, status: response.status });
      throw new EmailDeliveryFailedError(kind, response.status);
    }
    const sent = resendResponseSchema.safeParse(await response.json());
    logger.info({ event: "email_sent", kind, emailId: sent.success ? sent.data.id : null });
  };

  return {
    sendMagicLink: ({ email, url }) =>
      send("magic_link", email, magicLinkEmail({ url }, assetsUrl)),
    sendPasswordReset: ({ email, url }) =>
      send("password_reset", email, passwordResetEmail({ url }, assetsUrl)),
    sendInvitation: ({ email, url, organizationName, inviterName }) =>
      send("invitation", email, invitationEmail({ url, organizationName, inviterName }, assetsUrl)),
    sendTeamInvitation: ({ email, url, inviterName, role }) =>
      send("team_invitation", email, teamInvitationEmail({ url, inviterName, role }, assetsUrl)),
    sendMailSettingsChanged: ({ email, editorName, fields, at, url }) =>
      send(
        "mail_settings_changed",
        email,
        mailSettingsChangedEmail({ editorName, fields, at, url }, assetsUrl),
      ),
    sendProspectReminder: ({ email, ...reminder }) =>
      send("prospect_reminder", email, prospectReminderEmail(reminder, assetsUrl)),
  };
};
