import { createRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import * as z from "zod";
import { SettingsScreen } from "@/components/app-shell/settings-screen";
import { SubscriptionScreen } from "@/contexts/billing";
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

const subscriptionSearch = z.object({
  paiement: z.literal("ok").optional().catch(undefined),
});

export const subscriptionRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/reglages/abonnement",
  validateSearch: subscriptionSearch,
  component: function SubscriptionRouteScreen() {
    const { paiement } = subscriptionRoute.useSearch();
    const navigate = subscriptionRoute.useNavigate();
    const clearCheckoutReturn = useCallback(
      () => void navigate({ search: {}, replace: true }),
      [navigate],
    );
    return (
      <SubscriptionScreen
        isReturningFromCheckout={paiement === "ok"}
        onCheckoutConfirmed={clearCheckoutReturn}
      />
    );
  },
});
