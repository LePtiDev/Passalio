export type MailSettingsError =
  | "member_not_found"
  | "password_required"
  | "mailbox_not_configured"
  | MailboxDeliveryError;

export type MailboxDeliveryError = "smtp_auth_failed" | "smtp_unreachable" | "smtp_refused";
