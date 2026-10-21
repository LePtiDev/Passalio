import { createRoute, redirect } from "@tanstack/react-router";
import * as z from "zod";
import { SignInForm } from "@/contexts/identity";
import { loadSession, SIGN_IN_PATH } from "@/lib/session";
import { PublicLayout } from "./public-layout";
import { rootRoute } from "./root";

const signInSearch = z.object({
  retour: z.string().startsWith("/").optional(),
});

export const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: SIGN_IN_PATH,
  validateSearch: signInSearch,
  beforeLoad: async ({ search }) => {
    if ((await loadSession()) !== null) {
      throw redirect({ to: search.retour ?? "/" });
    }
  },
  component: function SignInScreen() {
    const { retour } = signInRoute.useSearch();
    return (
      <PublicLayout>
        <SignInForm returnTo={retour ?? "/"} />
      </PublicLayout>
    );
  },
});
