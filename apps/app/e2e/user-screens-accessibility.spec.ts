import { checkAccessibilityOf, checkTouchTargetsOf } from "./support/account-screen-checks";

checkAccessibilityOf([
  "signUp",
  "signUpErrors",
  "forgotPassword",
  "forgotPasswordSent",
  "newPassword",
  "expiredResetLink",
  "invitation",
  "settings",
  "teamPending",
  "inviteDialog",
  "removeConfirmation",
  "transferConfirmation",
]);

checkTouchTargetsOf([
  "invitation",
  "home",
  "settings",
  "roleMenu",
  "memberActions",
  "removeConfirmation",
  "transferConfirmation",
]);
