export type { RenderedEmail } from "./email-content";
export {
  invitationEmail,
  magicLinkEmail,
  passwordResetEmail,
  teamInvitationEmail,
  type InvitationEmailInput,
  type MagicLinkEmailInput,
  type PasswordResetEmailInput,
  type TeamInvitationEmailInput,
  type TeamInvitationRole,
} from "./transactional-emails";
export {
  mailboxTestEmail,
  mailSettingsChangedEmail,
  type MailboxTestEmailInput,
  type MailSettingsChangedEmailInput,
  type MailSettingsField,
} from "./mail-settings-emails";
export {
  prospectReminderEmail,
  type ProspectReminderEmailInput,
  type ReminderNotify,
  type ReminderTaskKind,
} from "./prospect-reminder-email";
