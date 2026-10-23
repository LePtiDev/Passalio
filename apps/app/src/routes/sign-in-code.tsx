import { createRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { AuthLayout, TwoFactorCodeForm, twoFactorFr } from "@/contexts/identity";
import { requireSignedOut, SIGN_IN_CODE_PATH } from "@/lib/session";
import { returnToSearch } from "./return-to-search";
import { rootRoute } from "./root";

export const signInCodeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: SIGN_IN_CODE_PATH,
  validateSearch: returnToSearch,
  beforeLoad: ({ search }) => requireSignedOut(search.retour),
  component: function SignInCodeScreen() {
    const { retour } = signInCodeRoute.useSearch();
    const navigate = signInCodeRoute.useNavigate();
    const open = useCallback(async () => {
      await navigate({ to: retour ?? "/" });
    }, [navigate, retour]);
    return (
      <AuthLayout showcase="sign-in">
        <TwoFactorCodeForm subtitle={twoFactorFr.code.subtitle} onVerified={open} />
      </AuthLayout>
    );
  },
});
