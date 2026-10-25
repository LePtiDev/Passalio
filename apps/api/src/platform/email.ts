import type { MailSettingsField, TeamInvitationRole } from "@passalio/emails";
import type { Logger } from "./logger";
import { createResendEmailSender } from "./resend-email-sender";

export type MagicLinkEmail = {
  readonly email: string;
  readonly url: string;
};

export type PasswordResetEmail = {
  readonly email: string;
  readonly url: string;
};

export type InvitationEmail = {
  readonly email: string;
  readonly organizationName: string;
  readonly inviterName: string | null;
  readonly url: string;
};

export type TeamInvitationEmail = {
  readonly email: string;
  readonly inviterName: string;
  readonly role: TeamInvitationRole;
  readonly url: string;
};

export type MailSettingsChangedEmail = {
  readonly email: string;
  readonly editorName: string;
  readonly fields: readonly MailSettingsField[];
  readonly at: Date;
  readonly url: string;
};

export type EmailSender = {
  readonly sendMagicLink: (email: MagicLinkEmail) => Promise<void>;
  readonly sendPasswordReset: (email: PasswordResetEmail) => Promise<void>;
  readonly sendInvitation: (email: InvitationEmail) => Promise<void>;
  readonly sendTeamInvitation: (email: TeamInvitationEmail) => Promise<void>;
  readonly sendMailSettingsChanged: (email: MailSettingsChangedEmail) => Promise<void>;
};

export type EmailDelivery = "log" | "resend" | "disabled";

export type EmailSettings = {
  readonly delivery: EmailDelivery;
  readonly resendApiKey: string | undefined;
  readonly from: string;
  readonly assetsUrl: string;
};

export class EmailDeliveryDisabledError extends Error {
  constructor() {
    super("Email delivery is not configured for this environment");
    this.name = "EmailDeliveryDisabledError";
  }
}

const createLogEmailSender = (logger: Logger): EmailSender => ({
  sendMagicLink: async ({ url }) => {
    logger.info({ event: "email_logged", kind: "magic_link", url });
  },
  sendPasswordReset: async ({ url }) => {
    logger.info({ event: "email_logged", kind: "password_reset", url });
  },
  sendInvitation: async ({ url }) => {
    logger.info({ event: "email_logged", kind: "invitation", url });
  },
  sendTeamInvitation: async ({ url }) => {
    logger.info({ event: "email_logged", kind: "team_invitation", url });
  },
  sendMailSettingsChanged: async ({ url, fields }) => {
    logger.info({ event: "email_logged", kind: "mail_settings_changed", url, fields });
  },
});

const disabledEmailSender: EmailSender = {
  sendMagicLink: async () => {
    throw new EmailDeliveryDisabledError();
  },
  sendPasswordReset: async () => {
    throw new EmailDeliveryDisabledError();
  },
  sendInvitation: async () => {
    throw new EmailDeliveryDisabledError();
  },
  sendTeamInvitation: async () => {
    throw new EmailDeliveryDisabledError();
  },
  sendMailSettingsChanged: async () => {
    throw new EmailDeliveryDisabledError();
  },
};

export const createEmailSender = (settings: EmailSettings, logger: Logger): EmailSender => {
  if (settings.delivery === "log") {
    return createLogEmailSender(logger);
  }
  if (settings.delivery === "resend" && settings.resendApiKey !== undefined) {
    return createResendEmailSender(
      { apiKey: settings.resendApiKey, from: settings.from, assetsUrl: settings.assetsUrl },
      logger,
    );
  }
  return disabledEmailSender;
};
