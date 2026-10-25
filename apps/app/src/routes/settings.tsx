import { createRoute } from "@tanstack/react-router";
import { SettingsScreen } from "@/components/app-shell/settings-screen";
import { CompanySettingsScreen, DocumentSettingsScreen } from "@/contexts/identity";
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

export const companySettingsRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/reglages/entreprise",
  component: CompanySettingsScreen,
});

export const documentSettingsRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/reglages/documents",
  component: DocumentSettingsScreen,
});
