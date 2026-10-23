import { useCallback, type ReactNode } from "react";
import { DesktopTopBar } from "@/components/app-shell/page-bars";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SyncPill } from "@/contexts/customers";
import { useLocalSession } from "@/lib/db/local-database-context";
import { runSync } from "@/lib/sync/sync-scheduler";
import { ApiRequestError } from "@/lib/api-client";
import { schedulingFr } from "../../fr";
import { DEFAULT_FIRST_HOUR, DEFAULT_LAST_HOUR } from "../../planning-layout";
import { dayNumberOf, longDayLabel, monthLabel, monthYearLabel } from "../../planning-dates";
import { agendasParam, type PlanningSearch, type PlanningView } from "../../planning-search";
import { usePlanning, type PlanningModel } from "../../hooks/use-planning";
import { usePlanningNavigation } from "../../hooks/use-planning-navigation";
import { DatePickerTitle } from "./date-picker-title";
import { PlanningDesktop } from "./planning-desktop";
import { NewVisitButton, PlanningMobile } from "./planning-mobile";
import { GridSkeleton, OfflineBar, SummarySkeleton } from "./planning-states";
import { PlanningToolbar } from "./planning-toolbar";
import { DesktopTechnicianPicker, MobileTechnicianPicker } from "./technician-picker";
import { ViewSwitch } from "./view-switch";
import { WeekStrip } from "./week-strip";

const text = schedulingFr.planning;

const TRAIL = [{ label: text.title }];

const DEFAULT_RANGE = { firstHour: DEFAULT_FIRST_HOUR, lastHour: DEFAULT_LAST_HOUR };

const desktopTitle = (day: string, view: PlanningView) =>
  view === "semaine" ? monthYearLabel(day) : longDayLabel(day);

const desktopSubtitle = (model: PlanningModel) => {
  if (model.view === "semaine") {
    const first = model.days[0] ?? model.day;
    const last = model.days.at(-1) ?? model.day;
    return text.weekRange(dayNumberOf(first), dayNumberOf(last));
  }
  return model.isTeam
    ? text.teamSummary(model.shownTechnicians.length, model.visits.length)
    : text.daySummary(model.visits.length, model.totalCents);
};

const useTeamPickers = (model: PlanningModel | undefined) => {
  const navigation = usePlanningNavigation();
  if (model === undefined || !model.canPlan || model.technicians.length < 2) {
    return { desktop: null, mobile: null };
  }
  const props = {
    technicians: model.technicians,
    selection: model.selection,
    visitCounts: model.visitCounts,
    onChange: (selection: readonly string[]) =>
      navigation.setAgendas(
        agendasParam(
          selection,
          model.technicians.map(({ userId }) => userId),
        ),
      ),
  };
  return {
    desktop: <DesktopTechnicianPicker {...props} />,
    mobile: <MobileTechnicianPicker {...props} />,
  };
};

const MobileBar = ({
  day,
  view,
  picker,
}: {
  readonly day: string;
  readonly view: PlanningView;
  readonly picker: ReactNode;
}) => {
  const navigation = usePlanningNavigation();
  return (
    <header className="sticky top-0 z-40 flex min-h-16 items-center gap-2 border-b border-[#EEF2F6] bg-white px-4 py-2 lg:hidden">
      <h1 className="sr-only">{text.title}</h1>
      <DatePickerTitle title={monthLabel(day)} day={day} onSelect={navigation.goToDay} />
      {picker}
      <ViewSwitch view={view} onChange={navigation.setView} isLarge />
    </header>
  );
};

const LoadingBody = ({ day, view }: { readonly day: string; readonly view: PlanningView }) => (
  <>
    <div className="hidden lg:flex lg:flex-1 lg:flex-col">
      <div className="flex items-center gap-3 px-6 pt-5 pb-3">
        <h1 className="text-xl font-bold tracking-[-0.015em]">{desktopTitle(day, view)}</h1>
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="px-6 pt-3 pb-6">
        <GridSkeleton range={DEFAULT_RANGE} hourHeight={60} gutterClassName="w-12" isBordered />
      </div>
    </div>
    <div className="flex flex-col lg:hidden">
      <SummarySkeleton />
      <div className="bg-white px-3 pt-3 pb-6">
        <GridSkeleton
          range={DEFAULT_RANGE}
          hourHeight={64}
          gutterClassName="w-11"
          isBordered={false}
        />
      </div>
    </div>
  </>
);

const FailedBody = ({
  day,
  view,
  error,
  onRetry,
}: {
  readonly day: string;
  readonly view: PlanningView;
  readonly error: unknown;
  readonly onRetry: () => void;
}) => (
  <>
    <div className="hidden px-6 pt-5 pb-3 lg:block">
      <h1 className="text-xl font-bold tracking-[-0.015em]">{desktopTitle(day, view)}</h1>
    </div>
    <div className="p-4 lg:px-6">
      <ErrorState error={error} onRetry={onRetry} message={text.errorMessage} />
    </div>
  </>
);

export const PlanningScreen = ({ search }: { readonly search: PlanningSearch }) => {
  const { database } = useLocalSession();
  const { state, sync } = usePlanning(search);
  const navigation = usePlanningNavigation();
  const model = state.status === "ready" ? state.model : undefined;
  const pickers = useTeamPickers(model);
  const day = model?.day ?? (state.status === "ready" ? state.model.day : state.day);
  const view = model?.view ?? (state.status === "ready" ? state.model.view : state.view);
  const retry = useCallback(() => {
    void runSync(database);
  }, [database]);
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-white">
      <DesktopTopBar trail={TRAIL}>
        <SyncPill />
      </DesktopTopBar>
      <MobileBar day={day} view={view} picker={pickers.mobile} />
      {sync.isOffline && state.status !== "failed" ? (
        <OfflineBar pendingCount={sync.pendingCount} />
      ) : null}
      {view === "jour" ? (
        <WeekStrip day={day} today={model?.today ?? day} onSelect={navigation.goToDay} />
      ) : null}
      {state.status === "loading" ? <LoadingBody day={day} view={view} /> : null}
      {state.status === "failed" ? (
        <FailedBody
          day={day}
          view={view}
          error={sync.error === null ? undefined : new ApiRequestError(sync.error)}
          onRetry={retry}
        />
      ) : null}
      {model === undefined ? null : (
        <>
          <PlanningToolbar
            title={desktopTitle(model.day, model.view)}
            subtitle={desktopSubtitle(model)}
            day={model.day}
            today={model.today}
            view={model.view}
            previousDay={model.previousDay}
            nextDay={model.nextDay}
            canPlan={model.canPlan}
            teamPicker={pickers.desktop}
          />
          <div className="hidden lg:flex lg:flex-1 lg:flex-col">
            <PlanningDesktop model={model} />
          </div>
          <div className="flex flex-col lg:hidden">
            <PlanningMobile model={model} />
          </div>
          {model.canPlan ? <NewVisitButton day={model.day} /> : null}
        </>
      )}
    </div>
  );
};
