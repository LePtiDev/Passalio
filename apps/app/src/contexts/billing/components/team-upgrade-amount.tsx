import type { TeamUpgradePreviewResponse } from "@passalio/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntil, formatShortDate } from "@/lib/format-date";
import { billingFr } from "../billing-fr";
import { formatCents, PLAN_PRICES_EUROS } from "../subscription-view";

const text = billingFr.teamUpgrade;

const PANEL_CLASS =
  "m-0 grid grid-cols-1 gap-x-4 gap-y-1 rounded-[10px] bg-[#F7F9FB] px-3.5 py-3 text-[15px] lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-y-2 lg:text-[14px]";

const LABEL_CLASS = "text-[#475569]";

const VALUE_CLASS = "m-0 mb-2 font-semibold lg:mb-0";

const NOTE_CLASS = "col-span-full text-[13px] text-[#64748B] lg:text-[12px]";

const prorataNote = (preview: TeamUpgradePreviewResponse, euros: number, isYearly: boolean) => {
  if (preview.currentPeriodEndsAt === null) {
    return null;
  }
  const periodEnd = new Date(preview.currentPeriodEndsAt);
  return text.prorata(
    daysUntil(periodEnd, new Date(preview.prorationDate * 1000)),
    formatShortDate(periodEnd),
    euros,
    isYearly,
  );
};

export const TeamUpgradeAmount = ({
  preview,
}: {
  readonly preview: TeamUpgradePreviewResponse;
}) => {
  const isYearly = preview.interval === "year";
  const euros = PLAN_PRICES_EUROS.team[preview.interval];
  const note = prorataNote(preview, euros, isYearly);
  return (
    <dl className={PANEL_CLASS}>
      <dt className={LABEL_CLASS}>{text.newPlan}</dt>
      <dd className={VALUE_CLASS}>{text.newPlanValue(euros, isYearly)}</dd>
      <dt className={LABEL_CLASS}>{text.dueToday}</dt>
      <dd className={VALUE_CLASS}>{formatCents(preview.amountDueCents)}</dd>
      {note === null ? null : <dt className={NOTE_CLASS}>{note}</dt>}
    </dl>
  );
};

export const TeamUpgradeAmountSkeleton = () => (
  <dl className={PANEL_CLASS} aria-busy="true" aria-label={text.loading}>
    <dt className={LABEL_CLASS}>{text.newPlan}</dt>
    <dd className={VALUE_CLASS}>
      <Skeleton className="h-4 w-40" />
    </dd>
    <dt className={LABEL_CLASS}>{text.dueToday}</dt>
    <dd className={VALUE_CLASS}>
      <Skeleton className="h-4 w-16" />
    </dd>
    <dt className="col-span-full">
      <Skeleton className="h-3.5 w-full max-w-80" />
    </dt>
  </dl>
);

type TeamUpgradeAmountErrorProps = {
  readonly codeLine: string | undefined;
  readonly onRetry: () => void;
};

export const TeamUpgradeAmountError = ({ codeLine, onRetry }: TeamUpgradeAmountErrorProps) => (
  <div className="flex flex-col items-start gap-3 rounded-[10px] bg-[#F7F9FB] px-3.5 py-3 text-[15px] lg:flex-row lg:items-center lg:justify-between lg:text-[14px]">
    <div role="alert" className="flex flex-col gap-1 text-[#475569]">
      <p>{text.loadFailed}</p>
      {codeLine === undefined ? null : (
        <p className="text-[13px] text-[#64748B] lg:text-[12px]">{codeLine}</p>
      )}
    </div>
    <Button variant="secondary" onClick={onRetry}>
      {text.retry}
    </Button>
  </div>
);
