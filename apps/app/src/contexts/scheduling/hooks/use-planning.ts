import { useMemo } from "react";
import { useSyncIndicator } from "@/contexts/customers";
import { useLocalSession } from "@/lib/db/local-database-context";
import { hourRangeOf, type HourRange } from "../planning-layout";
import { addDays, parisMinutesOf, todayOf, weekDaysOf } from "../planning-dates";
import { agendasOf, type PlanningSearch, type PlanningView } from "../planning-search";
import { totalAnnouncedCents, type PlanningVisit } from "../planning-visits";
import { colorAt, type TechnicianColor } from "../technician-colors";
import { selectedTechnicians, type Technician } from "../technicians";
import { isAssignedTo, assignedTechniciansOf } from "../visit-team";
import { useNow } from "./use-now";
import { usePlanningVisits } from "./use-planning-visits";
import { useTechnicians } from "./use-technicians";

export type PlanningModel = {
  readonly day: string;
  readonly today: string;
  readonly view: PlanningView;
  readonly days: readonly string[];
  readonly nowMinutes: number;
  readonly technicians: readonly Technician[];
  readonly shownTechnicians: readonly Technician[];
  readonly selection: readonly string[];
  readonly canPlan: boolean;
  readonly isTeam: boolean;
  readonly visits: readonly PlanningVisit[];
  readonly totalCents: number;
  readonly range: HourRange;
  readonly selectedVisit: PlanningVisit | undefined;
  readonly visitsOn: (day: string) => readonly PlanningVisit[];
  readonly visitsOf: (userId: string) => readonly PlanningVisit[];
  readonly colorOf: (visit: PlanningVisit) => TechnicianColor;
  readonly visitCounts: ReadonlyMap<string, number>;
  readonly previousDay: string;
  readonly nextDay: string;
};

export type PlanningState =
  | { readonly status: "loading"; readonly day: string; readonly view: PlanningView }
  | { readonly status: "failed"; readonly day: string; readonly view: PlanningView }
  | { readonly status: "ready"; readonly model: PlanningModel };

const countBy = (visits: readonly PlanningVisit[]) =>
  visits
    .flatMap(({ intervention }) => assignedTechniciansOf(intervention))
    .reduce(
      (counts, userId) => counts.set(userId, (counts.get(userId) ?? 0) + 1),
      new Map<string, number>(),
    );

export const usePlanning = (search: PlanningSearch) => {
  const { actor } = useLocalSession();
  const now = useNow();
  const sync = useSyncIndicator();
  const today = todayOf(now);
  const day = search.jour ?? today;
  const view = search.vue ?? "jour";
  const days = useMemo(() => (view === "semaine" ? weekDaysOf(day) : [day]), [view, day]);
  const allVisits = usePlanningVisits(days[0] ?? day, days.at(-1) ?? day);
  const team = useTechnicians();

  const state = useMemo((): PlanningState => {
    const isWaitingForFirstSync =
      sync.isLoaded && sync.lastSyncedAt === null && allVisits?.length === 0;
    if (isWaitingForFirstSync && (sync.phase === "error" || sync.isOffline)) {
      return { status: "failed", day, view };
    }
    if (allVisits === undefined || team === undefined || !sync.isLoaded || isWaitingForFirstSync) {
      return { status: "loading", day, view };
    }
    const selection = team.canPlan
      ? (agendasOf(search) ?? team.technicians.map(({ userId }) => userId))
      : [actor.userId];
    const shownTechnicians = selectedTechnicians(team.technicians, selection);
    const colors = new Map(team.technicians.map(({ userId, color }) => [userId, color]));
    const visits = allVisits.filter(({ intervention }) =>
      selection.some((userId) => isAssignedTo(intervention, userId)),
    );
    const step = view === "semaine" ? 7 : 1;
    return {
      status: "ready",
      model: {
        day,
        today,
        view,
        days,
        nowMinutes: parisMinutesOf(now),
        technicians: team.technicians,
        shownTechnicians,
        selection,
        canPlan: team.canPlan,
        isTeam: team.canPlan && shownTechnicians.length > 1,
        visits,
        totalCents: totalAnnouncedCents(visits),
        range: hourRangeOf(
          visits.flatMap(({ id, startMinutes, durationMinutes }) =>
            startMinutes === null ? [] : [{ id, startMinutes, durationMinutes }],
          ),
        ),
        selectedVisit: visits.find(({ id }) => id === search.passage),
        visitsOn: (visitDay) =>
          visits.filter(({ intervention }) => intervention.scheduledDate === visitDay),
        visitsOf: (userId) =>
          visits.filter(({ intervention }) => isAssignedTo(intervention, userId)),
        colorOf: ({ intervention }) => colors.get(intervention.technicianUserId) ?? colorAt(0),
        visitCounts: countBy(allVisits),
        previousDay: addDays(day, -step),
        nextDay: addDays(day, step),
      },
    };
  }, [allVisits, team, sync, search, actor.userId, day, view, days, today, now]);

  return { state, sync };
};
