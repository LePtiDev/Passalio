import { createRoute, redirect } from "@tanstack/react-router";
import { AuthLayout, SignInForm } from "@/contexts/identity";
import { loadSession, SIGN_IN_PATH } from "@/lib/session";
import { rootRoute } from "./root";
import { returnToSearch } from "./return-to-search";

export const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: SIGN_IN_PATH,
  validateSearch: returnToSearch,
  beforeLoad: async ({ search }) => {
    if ((await loadSession()) !== null) {
      throw redirect({ to: search.retour ?? "/" });
    }
  },
  component: function SignInScreen() {
    const { retour } = signInRoute.useSearch();
    return (
      <AuthLayout showcase="sign-in">
        <SignInForm returnTo={retour ?? "/"} />
      </AuthLayout>
    );
  },
});
