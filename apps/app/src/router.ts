import { createRouter } from "@tanstack/react-router";
import { homeRoute } from "./routes/home";
import { invitationRoute } from "./routes/invitation";
import { newOrganizationRoute } from "./routes/new-organization";
import { rootRoute } from "./routes/root";
import { signInRoute } from "./routes/sign-in";
import { signedInRoute } from "./routes/signed-in-layout";
import { teamRoute } from "./routes/team";

const routeTree = rootRoute.addChildren([
  signInRoute,
  newOrganizationRoute,
  invitationRoute,
  signedInRoute.addChildren([homeRoute, teamRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
