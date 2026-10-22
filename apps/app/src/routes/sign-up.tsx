import { createRoute, redirect } from "@tanstack/react-router";
import { AuthLayout, SignUpForm } from "@/contexts/identity";
import { loadSession, SIGN_UP_PATH } from "@/lib/session";
import { rootRoute } from "./root";
import { returnToSearch } from "./return-to-search";

export const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: SIGN_UP_PATH,
  validateSearch: returnToSearch,
  beforeLoad: async ({ search }) => {
    if ((await loadSession()) !== null) {
      throw redirect({ to: search.retour ?? "/" });
    }
  },
  component: function SignUpScreen() {
    const { retour } = signUpRoute.useSearch();
    return (
      <AuthLayout showcase="sign-up">
        <SignUpForm returnTo={retour ?? "/"} />
      </AuthLayout>
    );
  },
});
