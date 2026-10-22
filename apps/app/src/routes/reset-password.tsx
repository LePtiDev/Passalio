import { createRoute } from "@tanstack/react-router";
import * as z from "zod";
import { AuthLayout, ResetPasswordForm } from "@/contexts/identity";
import { RESET_PASSWORD_PATH } from "@/lib/session";
import { rootRoute } from "./root";

const resetPasswordSearch = z.object({
  token: z.string().min(1).optional(),
  error: z.string().optional(),
});

export const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: RESET_PASSWORD_PATH,
  validateSearch: resetPasswordSearch,
  component: function ResetPasswordScreen() {
    const { token, error } = resetPasswordRoute.useSearch();
    return (
      <AuthLayout showcase="sign-in">
        <ResetPasswordForm token={error === undefined ? (token ?? null) : null} />
      </AuthLayout>
    );
  },
});
