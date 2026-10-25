import type { CatalogedQuery } from "./cataloged-query";
import { AT, LATER } from "./domain-fixtures";

const settingsOf = (userId: string, at: Date) => ({
  userId,
  senderName: "Lina, Passalio",
  senderAddress: "lina@passalio.fr",
  replyTo: null,
  provider: "ovh_email_pro" as const,
  smtpHost: "pro1.mail.ovh.net",
  smtpPort: 587 as const,
  smtpUsername: "lina@passalio.fr",
  smtpPasswordCipher: "v1:iv:scelle",
  passwordUpdatedAt: at,
  verifiedAt: null,
  signature: null,
  reminderNotify: "minutes_15" as const,
  reminderAddress: null,
  updatedByUserId: userId,
  createdAt: at,
  updatedAt: at,
});

export const MAIL_SETTINGS_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "mailMembers.find",
    query: "a member of the Passalio team",
    run: (r, s) => r.mailMembers.find(s.salesperson.id),
  },
  {
    method: "mailSettings.find",
    query: "mail settings of a member with the name of the last editor",
    run: (r, s) => r.mailSettings.find(s.salesperson.id),
  },
  {
    method: "mailSettings.save",
    query: "save the mail settings of a member",
    run: async (r, s) => {
      await r.mailSettings.save(settingsOf(s.salesperson.id, AT));
      await r.mailSettings.save(settingsOf(s.salesperson.id, LATER));
    },
  },
  {
    method: "mailSettings.markVerified",
    query: "remember a successful mailbox test",
    run: (r, s) => r.mailSettings.markVerified(s.salesperson.id, LATER),
  },
];
