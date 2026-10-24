import type { TradeId } from "@passalio/trades";
import { Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { DASHED_CARD_CLASS, LINK_BUTTON_CLASS } from "@/contexts/customers";
import { DesktopTopBar, MobileTopBar, PageContent } from "@/components/app-shell/page-bars";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { VisitTypeRecord } from "@/lib/db/local-records";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import { useVisitTypeSettings } from "../../hooks/use-visit-type-settings";
import { DurationSheet } from "./duration-sheet";
import { VisitTypeRows } from "./visit-type-rows";

const text = schedulingFr.visitTypes;

const TRAIL = [{ label: text.settings, to: "/reglages" }, { label: text.title }] as const;

const NO_VISIT_TYPES: readonly VisitTypeRecord[] = [];

const SKELETON_ROWS = ["first", "second", "third"] as const;

const VisitTypesSkeleton = () => (
  <ul
    aria-busy="true"
    aria-label={text.loading}
    className="overflow-hidden rounded-[14px] border border-[#E3E8EF] bg-white lg:max-w-[620px] lg:rounded-xl"
  >
    {SKELETON_ROWS.map((row) => (
      <li
        key={row}
        className="flex min-h-[68px] items-center gap-3 border-b border-[#EEF2F6] px-3.5 last:border-b-0 lg:min-h-[52px] lg:px-4"
      >
        <Skeleton className="size-10 rounded-full lg:size-8" />
        <span className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3.5 w-28 lg:h-8 lg:w-[140px]" />
        </span>
      </li>
    ))}
  </ul>
);

const EmptyVisitTypes = () => (
  <div className={cn(DASHED_CARD_CLASS, "lg:max-w-[620px]")}>
    <span className="flex flex-col gap-1">
      <span className="text-[15px] font-semibold lg:text-sm">{text.emptyTitle}</span>
      <span className="text-sm text-[#64748B] lg:text-[13px]">{text.emptyText}</span>
    </span>
    <Link to="/reglages" className={LINK_BUTTON_CLASS}>
      {text.backToSettings}
    </Link>
  </div>
);

export const VisitTypesScreen = () => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { query, update, canEdit } = useVisitTypeSettings();
  const [openType, setOpenType] = useState<TradeId | null>(null);
  const visitTypes = query.data ?? NO_VISIT_TYPES;
  const opened = visitTypes.find(({ type }) => type === openType) ?? null;
  const save = useCallback(
    (type: TradeId, minutes: number) => {
      update.mutate({ [type]: minutes }, { onSettled: () => setOpenType(null) });
    },
    [update],
  );
  const saveOpened = useCallback(
    (minutes: number) => {
      if (openType !== null) {
        save(openType, minutes);
      }
    },
    [save, openType],
  );
  const close = useCallback(() => setOpenType(null), []);
  const retryLoad = useCallback(() => void query.refetch(), [query]);
  const retrySave = useCallback(() => {
    if (update.variables !== undefined) {
      update.mutate(update.variables);
    }
  }, [update]);

  return (
    <>
      <DesktopTopBar trail={TRAIL} />
      <MobileTopBar backTo="/reglages" backLabel={text.backToSettings}>
        <span className="flex flex-col">
          <h1 className="text-[17px] font-bold">{text.title}</h1>
          <span className="text-[13px] text-[#64748B]">{text.subtitle}</span>
        </span>
      </MobileTopBar>
      <PageContent>
        <div className="flex flex-col gap-1">
          <h1 className="hidden text-xl font-bold tracking-[-0.015em] lg:block">{text.title}</h1>
          <p className="text-[15px] text-[#475569] lg:text-[13px]">{text.intro}</p>
        </div>
        {update.isError ? (
          <div className="lg:max-w-[620px]">
            <ErrorState error={update.error} message={text.saveFailed} onRetry={retrySave} />
          </div>
        ) : null}
        {query.isPending ? <VisitTypesSkeleton /> : null}
        {query.isError ? (
          <div className="lg:max-w-[620px]">
            <ErrorState error={query.error} message={text.loadFailed} onRetry={retryLoad} />
          </div>
        ) : null}
        {query.isSuccess && visitTypes.length === 0 ? <EmptyVisitTypes /> : null}
        {visitTypes.length > 0 ? (
          <>
            <VisitTypeRows
              visitTypes={visitTypes}
              canEdit={canEdit}
              isDesktop={isDesktop}
              isSaving={update.isPending}
              onOpen={setOpenType}
              onSave={save}
            />
            <p className="text-sm text-[#64748B] lg:max-w-[620px] lg:text-[13px]">
              {text.footnote}
            </p>
          </>
        ) : null}
      </PageContent>
      {isDesktop ? null : (
        <DurationSheet
          visitType={opened}
          isSaving={update.isPending}
          onClose={close}
          onSave={saveOpened}
        />
      )}
    </>
  );
};
