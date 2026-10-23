import { useCallback } from "react";
import { ErrorState } from "@/components/error-state";
import { monthYearOf } from "../../calendar-labels";
import { backofficeFr } from "../../fr";
import { useOverview } from "../../hooks/use-backoffice-queries";
import { useNow } from "../../hooks/use-now";
import { AdminHeading, AdminPage, type AdminTrailStep } from "../shell/admin-page";
import { DroppingCard } from "./dropping-card";
import { MovementsCard } from "./movements-card";
import { OverviewSkeleton } from "./overview-skeleton";
import { OverviewTiles } from "./overview-tiles";
import { TrialsCard } from "./trials-card";

const text = backofficeFr.overview;

const TRAIL: readonly AdminTrailStep[] = [{ label: text.title }];

export const OverviewScreen = () => {
  const overview = useOverview();
  const { refetch } = overview;
  const retry = useCallback(() => void refetch(), [refetch]);
  const month = monthYearOf(useNow());
  return (
    <AdminPage trail={TRAIL} mobileTitle={text.title} mobileSubtitle={text.mobileSubtitle(month)}>
      <AdminHeading title={text.title} subtitle={text.subtitle(month)} />
      {overview.isPending ? <OverviewSkeleton /> : null}
      {overview.isError ? <ErrorState error={overview.error} onRetry={retry} /> : null}
      {overview.isSuccess ? (
        <>
          <OverviewTiles counts={overview.data.counts} />
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-5">
            <DroppingCard accounts={overview.data.dropping} />
            <div className="flex flex-col gap-4 lg:gap-5">
              <TrialsCard accounts={overview.data.endingTrials} />
              <MovementsCard entries={overview.data.movements} />
            </div>
          </div>
        </>
      ) : null}
    </AdminPage>
  );
};
