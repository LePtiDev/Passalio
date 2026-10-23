import { createRoute } from "@tanstack/react-router";
import * as z from "zod";
import {
  NewVisitScreen,
  newVisitSearch,
  PlanningScreen,
  planningSearch,
  VisitScreen,
} from "@/contexts/scheduling";
import { signedInRoute } from "./signed-in-layout";

const visitParams = z.object({ interventionId: z.string().max(64) });

export const planningRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/planning",
  validateSearch: planningSearch,
  component: function PlanningRouteScreen() {
    return <PlanningScreen search={planningRoute.useSearch()} />;
  },
});

export const newVisitRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/planning/nouveau",
  validateSearch: newVisitSearch,
  component: function NewVisitRouteScreen() {
    return <NewVisitScreen search={newVisitRoute.useSearch()} />;
  },
});

export const visitRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/passages/$interventionId",
  params: { parse: (params) => visitParams.parse(params) },
  component: function VisitRouteScreen() {
    const { interventionId } = visitRoute.useParams();
    return <VisitScreen interventionId={interventionId} />;
  },
});
