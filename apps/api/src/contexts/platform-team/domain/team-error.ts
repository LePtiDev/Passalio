export type TeamError =
  | "already_in_team"
  | "teammate_not_found"
  | "cannot_change_own_role"
  | "invitation_not_found"
  | "invitation_expired"
  | "invitation_email_mismatch";
