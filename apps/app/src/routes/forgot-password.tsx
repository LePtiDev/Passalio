import { createRoute } from "@tanstack/react-router";
import { AuthLayout, ForgotPasswordForm } from "@/contexts/identity";
import { FORGOT_PASSWORD_PATH, requireSignedOut } from "@/lib/session";
import { rootRoute } from "./root";

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: FORGOT_PASSWORD_PATH,
  beforeLoad: () => requireSignedOut(),
  component: () => (
    <AuthLayout showcase="sign-in">
      <ForgotPasswordForm />
    </AuthLayout>
  ),
});
