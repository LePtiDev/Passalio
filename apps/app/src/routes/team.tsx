import { createRoute } from "@tanstack/react-router";
import { TeamUpgradeDialog } from "@/contexts/billing";
import { TeamScreen, TeamScreenSkeleton } from "@/contexts/identity";
import { signedInRoute } from "./signed-in-layout";

const TeamWithUpgradeScreen = () => <TeamScreen teamPlanUpgrade={TeamUpgradeDialog} />;

export const teamRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/equipe",
  pendingComponent: TeamScreenSkeleton,
  component: TeamWithUpgradeScreen,
});
