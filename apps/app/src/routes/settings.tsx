import { createRoute } from "@tanstack/react-router";
import { SettingsScreen } from "@/components/app-shell/settings-screen";
import { VisitTypesScreen } from "@/contexts/scheduling";
import { signedInRoute } from "./signed-in-layout";

export const settingsRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/reglages",
  component: function SettingsRouteScreen() {
    const { user } = settingsRoute.useRouteContext();
    return <SettingsScreen user={user} />;
  },
});

export const visitTypesRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/reglages/types-de-passage",
  component: VisitTypesScreen,
});
