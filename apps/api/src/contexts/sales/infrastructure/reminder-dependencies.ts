import { err, ok } from "@passalio/shared";
import type { Database } from "../../../platform/database";
import { EmailDeliveryDisabledError, type EmailSender } from "../../../platform/email";
import { EmailDeliveryFailedError } from "../../../platform/resend-email-sender";
import type { ReminderDependencies } from "../domain/reminder-ports";
import { createD1ReminderRepository } from "./d1-reminder-repository";

export type ReminderInfrastructure = {
  readonly database: Database;
  readonly emailSender: EmailSender;
  readonly appUrl: string;
};

export const companyFileUrl = (appUrl: string, companyId: string) =>
  `${appUrl}/admin/entreprises/${companyId}`;

const isDeliveryError = (error: unknown) =>
  error instanceof EmailDeliveryFailedError || error instanceof EmailDeliveryDisabledError;

export const createReminderDependencies = ({
  database,
  emailSender,
  appUrl,
}: ReminderInfrastructure): ReminderDependencies => ({
  reminders: createD1ReminderRepository(database),
  mailer: {
    send: async ({ recipient, company, ...reminder }) => {
      try {
        await emailSender.sendProspectReminder({
          email: recipient,
          kind: reminder.kind,
          notify: reminder.notify,
          dueAt: reminder.dueAt,
          companyName: company.name,
          companyCity: company.city,
          contactName: reminder.contactName,
          phone: reminder.phone,
          lastNote: reminder.lastNote,
          interest: reminder.interest,
          teamSize: reminder.teamSize,
          toolKind: reminder.toolKind,
          companyUrl: companyFileUrl(appUrl, company.id),
        });
        return ok(undefined);
      } catch (error) {
        if (isDeliveryError(error)) {
          return err("delivery_failed");
        }
        throw error;
      }
    },
  },
  now: () => new Date(),
});
