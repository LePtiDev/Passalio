import { createRoute } from "@tanstack/react-router";
import { TeamScreen, TeamScreenSkeleton } from "@/contexts/identity";
import { signedInRoute } from "./signed-in-layout";

export const teamRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/equipe",
  pendingComponent: TeamScreenSkeleton,
  component: TeamScreen,
});
