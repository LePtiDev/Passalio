import type { Logger } from "./logger";

export type MagicLinkEmail = {
  readonly email: string;
  readonly url: string;
};

export type InvitationEmail = {
  readonly email: string;
  readonly organizationName: string;
  readonly url: string;
};

export type EmailSender = {
  readonly sendMagicLink: (email: MagicLinkEmail) => Promise<void>;
  readonly sendInvitation: (email: InvitationEmail) => Promise<void>;
};

export type EmailDelivery = "log" | "disabled";

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
  sendInvitation: async ({ url }) => {
    logger.info({ event: "email_logged", kind: "invitation", url });
  },
});

const disabledEmailSender: EmailSender = {
  sendMagicLink: async () => {
    throw new EmailDeliveryDisabledError();
  },
  sendInvitation: async () => {
    throw new EmailDeliveryDisabledError();
  },
};

export const createEmailSender = (delivery: EmailDelivery, logger: Logger): EmailSender =>
  delivery === "log" ? createLogEmailSender(logger) : disabledEmailSender;
