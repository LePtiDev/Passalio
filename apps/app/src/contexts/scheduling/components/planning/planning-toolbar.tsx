import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, type ReactNode } from "react";
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "@/contexts/customers";
import { Button } from "@/components/ui/button";
import { schedulingFr } from "../../fr";
import type { PlanningView } from "../../planning-search";
import { usePlanningNavigation } from "../../hooks/use-planning-navigation";
import { NewVisitLink } from "./new-visit-link";
import { ViewSwitch } from "./view-switch";

const text = schedulingFr.planning;

const NAV_BUTTON_CLASS =
  "flex size-8 items-center justify-center rounded-[7px] text-[#64748B] hover:bg-[#F1F5F9]";

export const PlanningToolbar = ({
  title,
  subtitle,
  day,
  today,
  view,
  previousDay,
  nextDay,
  canPlan,
  teamPicker,
}: {
  readonly title: string;
  readonly subtitle: ReactNode;
  readonly day: string;
  readonly today: string;
  readonly view: PlanningView;
  readonly previousDay: string;
  readonly nextDay: string;
  readonly canPlan: boolean;
  readonly teamPicker: ReactNode;
}) => {
  const { goToDay, setView } = usePlanningNavigation();
  const goToToday = useCallback(() => goToDay(today), [goToDay, today]);
  const goToPrevious = useCallback(() => goToDay(previousDay), [goToDay, previousDay]);
  const goToNext = useCallback(() => goToDay(nextDay), [goToDay, nextDay]);
  return (
    <div className="hidden items-center justify-between gap-4 px-6 pt-5 pb-3 lg:flex">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-xl font-bold tracking-[-0.015em]">{title}</h1>
        <span className="shrink-0 text-[13px] text-[#64748B]">{subtitle}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={day === today}
          onClick={goToToday}
          className={SECONDARY_BUTTON_CLASS}
        >
          {text.today}
        </Button>
        <button
          type="button"
          aria-label={text.previous}
          onClick={goToPrevious}
          className={NAV_BUTTON_CLASS}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          aria-label={text.next}
          onClick={goToNext}
          className={NAV_BUTTON_CLASS}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
        {teamPicker}
        <ViewSwitch view={view} onChange={setView} isLarge={false} />
        {canPlan ? (
          <Button asChild className={PRIMARY_BUTTON_CLASS}>
            <NewVisitLink day={day}>
              <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
              {text.newVisit}
            </NewVisitLink>
          </Button>
        ) : null}
      </div>
    </div>
  );
};
