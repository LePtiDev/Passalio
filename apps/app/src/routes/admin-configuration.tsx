import { createRoute } from "@tanstack/react-router";
import * as z from "zod";
import { CONFIGURATION_TABS, ConfigurationScreen } from "@/contexts/sales";
import { adminShellRoute } from "./admin";

const configurationSearch = z.object({
  membre: z.string().min(1).max(64).optional().catch(undefined),
  rubrique: z.enum(CONFIGURATION_TABS).optional().catch(undefined),
});

export const adminConfigurationRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/configuration",
  validateSearch: configurationSearch,
  component: function AdminConfigurationRouteScreen() {
    const admin = adminShellRoute.useRouteContext({ select: (context) => context.admin });
    const { membre, rubrique } = adminConfigurationRoute.useSearch();
    return <ConfigurationScreen admin={admin} memberId={membre} tab={rubrique ?? "boite"} />;
  },
});
