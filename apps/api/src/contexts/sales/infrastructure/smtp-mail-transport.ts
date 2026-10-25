import { err, ok, SECURITY_OF_PORT } from "@passalio/shared";
import type { Logger } from "../../../platform/logger";
import type { MailboxDeliveryError } from "../domain/mail-settings-error";
import type { MailTransport } from "../domain/mail-settings-ports";

const TIMEOUT_MS = 15_000;
const AUTH_FAILURE = /authentication|invalid login|no supported auth|requires authentication/i;
const CONNECTION_FAILURE = /socket|connect|timeout|tls|ehlo|helo|network/i;

export const deliveryErrorOf = (error: unknown): MailboxDeliveryError => {
  const message = error instanceof Error ? error.message : "";
  if (AUTH_FAILURE.test(message)) {
    return "smtp_auth_failed";
  }
  return CONNECTION_FAILURE.test(message) ? "smtp_unreachable" : "smtp_refused";
};

export const createSmtpMailTransport = (logger: Logger): MailTransport => ({
  send: async (mailbox, mail) => {
    const { WorkerMailer, LogLevel } = await import("worker-mailer");
    const isImplicitTls = SECURITY_OF_PORT[mailbox.port] === "ssl";
    try {
      await WorkerMailer.send(
        {
          host: mailbox.host,
          port: mailbox.port,
          secure: isImplicitTls,
          startTls: !isImplicitTls,
          credentials: { username: mailbox.username, password: mailbox.password },
          authType: ["plain", "login"],
          logLevel: LogLevel.NONE,
          socketTimeoutMs: TIMEOUT_MS,
          responseTimeoutMs: TIMEOUT_MS,
        },
        {
          from: { name: mailbox.senderName, email: mailbox.senderAddress },
          to: mail.to,
          ...(mailbox.replyTo === null ? {} : { reply: mailbox.replyTo }),
          subject: mail.subject,
          text: mail.text,
          html: mail.html,
        },
      );
      logger.info({ event: "mailbox_mail_sent", host: mailbox.host, port: mailbox.port });
      return ok(null);
    } catch (error) {
      const reason = deliveryErrorOf(error);
      logger.warn({ event: "mailbox_mail_failed", host: mailbox.host, port: mailbox.port, reason });
      return err(reason);
    }
  },
});

export const createLogMailTransport = (logger: Logger): MailTransport => ({
  send: async (mailbox, mail) => {
    logger.info({
      event: "mailbox_mail_logged",
      host: mailbox.host,
      port: mailbox.port,
      subject: mail.subject,
    });
    return ok(null);
  },
});
