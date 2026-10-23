import { createRoute } from "@tanstack/react-router";
import { AuthLayout, SignInForm } from "@/contexts/identity";
import { requireSignedOut, SIGN_IN_PATH } from "@/lib/session";
import { rootRoute } from "./root";
import { returnToSearch } from "./return-to-search";

export const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: SIGN_IN_PATH,
  validateSearch: returnToSearch,
  beforeLoad: ({ search }) => requireSignedOut(search.retour),
  component: function SignInScreen() {
    const { retour } = signInRoute.useSearch();
    return (
      <AuthLayout showcase="sign-in">
        <SignInForm returnTo={retour ?? "/"} />
      </AuthLayout>
    );
  },
});
