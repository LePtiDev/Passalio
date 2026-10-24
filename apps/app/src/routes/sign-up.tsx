import { createRoute } from "@tanstack/react-router";
import { SignUpScreen } from "@/contexts/identity";
import { requireSignedOut, SIGN_UP_PATH } from "@/lib/session";
import { rootRoute } from "./root";
import { returnToSearch } from "./return-to-search";

export const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: SIGN_UP_PATH,
  validateSearch: returnToSearch,
  beforeLoad: ({ search }) => requireSignedOut(search.retour),
  component: function SignUpRouteScreen() {
    const { retour } = signUpRoute.useSearch();
    return <SignUpScreen returnTo={retour} />;
  },
});
