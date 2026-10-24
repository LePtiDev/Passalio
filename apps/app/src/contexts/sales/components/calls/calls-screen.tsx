import { useCallback } from "react";
import { ErrorState } from "@/components/error-state";
import { AdminHeading, AdminPage, useNow, type AdminTrailStep } from "@/contexts/backoffice";
import { callsFr } from "../../fr-calls";
import { useMyDay } from "../../hooks/use-call-queries";
import { CallSeriesCard } from "./call-series-card";
import { TaskRowsSkeleton } from "./calls-skeletons";
import { DueTasks } from "./due-tasks";

const text = callsFr.calls;

const TRAIL: readonly AdminTrailStep[] = [{ label: text.title }];

export const CallsScreen = () => {
  const now = useNow();
  const day = useMyDay();
  const { refetch } = day;
  const retry = useCallback(() => void refetch(), [refetch]);
  const subtitle = text.subtitle(day.data?.tasks.length ?? null);
  return (
    <AdminPage
      section="commercial"
      trail={TRAIL}
      mobileTitle={text.title}
      mobileSubtitle={subtitle}
    >
      <AdminHeading title={text.title} subtitle={subtitle} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        <div className="flex flex-col gap-4">
          {day.isPending ? <TaskRowsSkeleton /> : null}
          {day.isError ? <ErrorState error={day.error} onRetry={retry} /> : null}
          {day.isSuccess ? <DueTasks tasks={day.data.tasks} now={now} /> : null}
        </div>
        <CallSeriesCard />
      </div>
    </AdminPage>
  );
};
