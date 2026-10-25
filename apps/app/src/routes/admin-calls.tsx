import { CALL_SERIES_TARGETS, DEPARTMENT_PATTERN } from "@passalio/shared";
import { createRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import * as z from "zod";
import {
  CALL_SERIES_DEFAULT_SIZE,
  CALL_SERIES_MAX_SIZE,
  CALL_SERIES_MIN_SIZE,
  CallSessionScreen,
  CallsScreen,
  MyDayScreen,
  type CallSession,
} from "@/contexts/sales";
import { textParam } from "@/lib/search-params";
import { adminShellRoute } from "./admin";

export const adminMyDayRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/journee",
  component: MyDayScreen,
});

export const adminCallsRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/appels",
  component: CallsScreen,
});

const sessionSearch = z.object({
  departement: textParam(z.string().regex(DEPARTMENT_PATTERN)).optional().catch(undefined),
  cible: z.enum(CALL_SERIES_TARGETS).optional().catch(undefined),
  nombre: z.coerce
    .number()
    .int()
    .min(CALL_SERIES_MIN_SIZE)
    .max(CALL_SERIES_MAX_SIZE)
    .optional()
    .catch(undefined),
  entreprise: z.uuid().optional().catch(undefined),
  tache: z.uuid().optional().catch(undefined),
  depuis: z.literal("journee").optional().catch(undefined),
});

export const adminCallSessionRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/appels/serie",
  validateSearch: sessionSearch,
  component: function AdminCallSessionRouteScreen() {
    const { departement, cible, nombre, entreprise, tache, depuis } =
      adminCallSessionRoute.useSearch();
    const session = useMemo((): CallSession => {
      if (entreprise !== undefined) {
        return { kind: "single", companyId: entreprise, taskId: tache ?? null };
      }
      if (depuis === "journee") {
        return { kind: "day" };
      }
      return {
        kind: "series",
        department: departement ?? null,
        target: cible ?? "never_called",
        size: nombre ?? CALL_SERIES_DEFAULT_SIZE,
      };
    }, [departement, cible, nombre, entreprise, tache, depuis]);
    return <CallSessionScreen session={session} />;
  },
});
