import { Plus } from "lucide-react";
import { useMemo } from "react";
import { schedulingFr } from "../../fr";
import { dayMonthLabel, dayNumberOf, longDayLabel } from "../../planning-dates";
import type { PlanningModel } from "../../hooks/use-planning";
import { NewVisitLink } from "./new-visit-link";
import { EmptyPlanning } from "./planning-states";
import { TeamRows } from "./team-rows";
import { TimeGrid } from "./time-grid";
import { UntimedVisits } from "./untimed-visits";
import { WeekAgenda } from "./week-agenda";

const text = schedulingFr.planning;

const HOUR_HEIGHT = 64;

const MOBILE_MAX_LANES = 3;

export const SummaryLine = ({ left, right }: { readonly left: string; readonly right: string }) => (
  <div className="flex items-center justify-between border-b border-[#EEF2F6] bg-white px-4 py-2.5 text-[13px] text-[#64748B] lg:hidden">
    <span>{left}</span>
    <span className="tabular-nums">{right}</span>
  </div>
);

export const NewVisitButton = ({ day }: { readonly day: string }) => (
  <NewVisitLink
    day={day}
    label={text.newVisit}
    className="fixed right-4 bottom-[92px] z-30 flex size-14 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_6px_16px_rgba(15,42,68,0.28)] lg:hidden"
  >
    <Plus aria-hidden="true" className="size-6" />
  </NewVisitLink>
);

const MobileDay = ({ model }: { readonly model: PlanningModel }) => {
  const { day, today, visits, colorOf } = model;
  const columns = useMemo(
    () => [{ key: day, day, visits, colorOf, isMuted: false, hasNow: day === today }],
    [day, today, visits, colorOf],
  );
  return (
    <>
      <SummaryLine
        left={longDayLabel(model.day)}
        right={
          model.isTeam
            ? text.visitCount(model.visits.length)
            : text.daySummary(model.visits.length, model.totalCents)
        }
      />
      {model.isTeam && model.visits.length === 0 ? (
        <EmptyPlanning title={text.emptyTitle} canPlan={model.canPlan} day={model.day} isInline />
      ) : null}
      {model.isTeam ? (
        <TeamRows
          technicians={model.shownTechnicians}
          visitsOf={model.visitsOf}
          nowMinutes={model.day === model.today ? model.nowMinutes : null}
        />
      ) : (
        <div className="relative bg-white">
          <UntimedVisits
            visits={model.visits}
            colorOf={model.colorOf}
            mode="open"
            className="px-4 pt-3"
          />
          <div className="px-3 pt-3 pb-24">
            <TimeGrid
              columns={columns}
              range={model.range}
              hourHeight={HOUR_HEIGHT}
              nowMinutes={model.nowMinutes}
              size="large"
              showCity
              useShortName={false}
              selectedId={undefined}
              linkMode="open"
              gutterClassName="w-11"
              isBordered={false}
              maxLanes={MOBILE_MAX_LANES}
              label={text.gridLabel(longDayLabel(model.day))}
            />
          </div>
          {model.visits.length === 0 ? (
            <EmptyPlanning title={text.emptyTitle} canPlan={model.canPlan} day={model.day} />
          ) : null}
        </div>
      )}
    </>
  );
};

const MobileWeek = ({ model }: { readonly model: PlanningModel }) => {
  const first = model.days[0] ?? model.day;
  const last = model.days.at(-1) ?? model.day;
  const { days, today } = model;
  const shownDays = useMemo(
    () => (days.includes(today) ? days.filter((day) => day >= today) : days),
    [days, today],
  );
  return (
    <>
      <SummaryLine
        left={text.weekRange(dayNumberOf(first), dayMonthLabel(last))}
        right={text.visitCount(model.visits.length)}
      />
      <WeekAgenda
        days={shownDays}
        today={model.today}
        visitsOn={model.visitsOn}
        colorOf={model.colorOf}
      />
    </>
  );
};

export const PlanningMobile = ({ model }: { readonly model: PlanningModel }) =>
  model.view === "semaine" ? <MobileWeek model={model} /> : <MobileDay model={model} />;
