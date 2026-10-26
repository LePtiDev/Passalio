import { Link } from "@tanstack/react-router";
import { Play, Settings } from "lucide-react";
import { useCallback, useMemo } from "react";
import { ErrorState } from "@/components/error-state";
import { buttonVariants } from "@/components/ui/button";
import { AdminHeading, AdminPage, useNow, type AdminTrailStep } from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { dayTitle } from "../../call-time-labels";
import { callsFr } from "../../fr-calls";
import { useMyDay } from "../../hooks/use-call-queries";
import { MyDaySkeleton } from "./calls-skeletons";
import { myDaySummaryOf } from "./my-day-summary";
import { MyDayTasks } from "./my-day-tasks";
import { MyDayTiles } from "./my-day-tiles";

const text = callsFr.myDay;

const TRAIL: readonly AdminTrailStep[] = [{ label: text.title }];

const DAY_SEARCH = { depuis: "journee" } as const;

const StartCallsLink = ({
  hasTasks,
  className,
}: {
  readonly hasTasks: boolean;
  readonly className?: string;
}) => {
  const classes = cn(buttonVariants(), className);
  const content = (
    <>
      <Play aria-hidden="true" className="size-4" strokeWidth={2} />
      {text.start}
    </>
  );
  return hasTasks ? (
    <Link to="/admin/appels/serie" search={DAY_SEARCH} className={classes}>
      {content}
    </Link>
  ) : (
    <Link to="/admin/appels" className={classes}>
      {content}
    </Link>
  );
};

const CONFIGURATION_LINK = (
  <Link
    to="/admin/configuration"
    aria-label={text.configuration}
    className="-mr-2 flex size-12 shrink-0 items-center justify-center rounded-xl text-[#475569]"
  >
    <Settings aria-hidden="true" className="size-[22px]" />
  </Link>
);

export const MyDayScreen = () => {
  const now = useNow();
  const day = useMyDay();
  const { refetch } = day;
  const retry = useCallback(() => void refetch(), [refetch]);
  const summary = useMemo(
    () => (day.data === undefined ? null : myDaySummaryOf(day.data, now)),
    [day.data, now],
  );
  const hasTasks = (day.data?.tasks.length ?? 0) > 0;
  const title = dayTitle(now);
  return (
    <AdminPage
      section="commercial"
      trail={TRAIL}
      mobileTitle={text.title}
      mobileSubtitle={title}
      mobileAction={CONFIGURATION_LINK}
    >
      <AdminHeading title={text.title} subtitle={title}>
        {day.isSuccess ? <StartCallsLink hasTasks={hasTasks} /> : null}
      </AdminHeading>
      {day.isPending ? <MyDaySkeleton /> : null}
      {day.isError ? <ErrorState error={day.error} onRetry={retry} /> : null}
      {day.isSuccess && summary !== null ? (
        <div className="flex flex-col gap-4 lg:gap-6">
          <MyDayTiles summary={summary} />
          <StartCallsLink hasTasks={hasTasks} className="w-full lg:hidden" />
          <MyDayTasks tasks={day.data.tasks} now={now} />
        </div>
      ) : null}
    </AdminPage>
  );
};
