import { createRoute } from "@tanstack/react-router";
import { SettingsScreen } from "@/components/app-shell/settings-screen";
import { ServicesScreen } from "@/contexts/scheduling";
import { signedInRoute } from "./signed-in-layout";

export const settingsRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/reglages",
  component: function SettingsRouteScreen() {
    const { user } = settingsRoute.useRouteContext();
    return <SettingsScreen user={user} />;
  },
});

export const servicesRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/reglages/prestations",
  component: ServicesScreen,
});
