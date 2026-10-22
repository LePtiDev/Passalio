import { createRoute } from "@tanstack/react-router";
import * as z from "zod";
import { HomeScreen } from "@/components/dashboard/home-screen";
import { signedInRoute } from "./signed-in-layout";

const homeSearch = z.object({
  bienvenue: z.boolean().optional().catch(undefined),
});

export const homeRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/",
  validateSearch: homeSearch,
  component: function HomeRouteScreen() {
    const { user } = homeRoute.useRouteContext();
    const { bienvenue } = homeRoute.useSearch();
    return <HomeScreen userName={user.name} isWelcome={bienvenue === true} />;
  },
});
