import { schedulingFr } from "../../fr";
import { isWeekend, longDayLabel } from "../../planning-dates";
import type { PlanningModel } from "../../hooks/use-planning";
import { usePlanningNavigation } from "../../hooks/use-planning-navigation";
import { TeamHeader, WeekDayHeader } from "./planning-headers";
import { EmptyPlanning } from "./planning-states";
import { TimeGrid, type GridColumn } from "./time-grid";
import { UntimedVisits } from "./untimed-visits";
import { VisitPanel } from "./visit-panel";

const HOUR_HEIGHT = { day: 60, week: 52 } as const;

const GUTTER = "w-12";

const WEEK_MAX_LANES = 2;

const DAY_MAX_LANES = 4;

const dayColumns = (model: PlanningModel): readonly GridColumn[] =>
  model.isTeam
    ? model.shownTechnicians.map((technician) => ({
        key: technician.userId,
        day: model.day,
        visits: model.visitsOf(technician.userId),
        colorOf: model.colorOf,
        isMuted: false,
        hasNow: model.day === model.today,
      }))
    : [
        {
          key: model.day,
          day: model.day,
          visits: model.visits,
          colorOf: model.colorOf,
          isMuted: false,
          hasNow: model.day === model.today,
        },
      ];

const weekColumns = (model: PlanningModel): readonly GridColumn[] =>
  model.days.map((day) => ({
    key: day,
    day,
    visits: model.visitsOn(day),
    colorOf: model.colorOf,
    isMuted: isWeekend(day),
    hasNow: day === model.today,
  }));

export const PlanningDesktop = ({ model }: { readonly model: PlanningModel }) => {
  const navigation = usePlanningNavigation();
  const isWeek = model.view === "semaine";
  const hourHeight = isWeek ? HOUR_HEIGHT.week : HOUR_HEIGHT.day;
  const isSingle = !isWeek && !model.isTeam;
  const isEmpty = model.visits.length === 0;
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {isWeek ? <WeekDayHeader days={model.days} today={model.today} /> : null}
        {!isWeek && model.isTeam ? (
          <TeamHeader technicians={model.shownTechnicians} visitCounts={model.visitCounts} />
        ) : null}
        <UntimedVisits
          visits={model.visits}
          colorOf={model.colorOf}
          mode={isSingle ? "select" : "open"}
          className="px-6 pt-3 pl-[72px]"
        />
        <div className="relative flex px-6 pt-3 pb-6">
          <div className="min-w-0 flex-1">
            <TimeGrid
              columns={isWeek ? weekColumns(model) : dayColumns(model)}
              range={model.range}
              hourHeight={hourHeight}
              nowMinutes={model.nowMinutes}
              size={isSingle ? "large" : "small"}
              showCity={isSingle}
              useShortName={isWeek}
              selectedId={model.selectedVisit?.id}
              linkMode={isSingle ? "select" : "open"}
              gutterClassName={GUTTER}
              isBordered
              maxLanes={isWeek ? WEEK_MAX_LANES : DAY_MAX_LANES}
              label={schedulingFr.planning.gridLabel(longDayLabel(model.day))}
            />
          </div>
          {isEmpty ? (
            <EmptyPlanning
              title={
                isWeek ? schedulingFr.planning.emptyWeekTitle : schedulingFr.planning.emptyTitle
              }
              canPlan={model.canPlan}
              day={model.day}
            />
          ) : null}
        </div>
      </div>
      {isSingle && model.selectedVisit !== undefined ? (
        <VisitPanel visit={model.selectedVisit} onClose={navigation.closePanel} />
      ) : null}
    </div>
  );
};
