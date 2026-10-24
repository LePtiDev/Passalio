import { checkTouchTargetsOf } from "./support/account-screen-checks";

checkTouchTargetsOf([
  "signIn",
  "refusedSignIn",
  "signUp",
  "signUpErrors",
  "forgotPassword",
  "forgotPasswordSent",
  "newPassword",
  "expiredResetLink",
]);
