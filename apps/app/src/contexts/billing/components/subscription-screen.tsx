import { TriangleAlert } from "lucide-react";
import { useCallback, useState } from "react";
import { OrganizationSubtitle } from "@/contexts/identity";
import { DesktopTopBar, MobileTopBar, type BreadcrumbStep } from "@/components/app-shell/page-bars";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fr } from "@/fr";
import { apiErrorOf } from "@/lib/api-client";
import { errorCodeLine } from "@/lib/errors";
import { billingFr } from "../billing-fr";
import { useBillingSeats } from "../hooks/use-billing-details";
import { checkoutRefetchRule, useCheckoutWelcome } from "../hooks/use-checkout-return";
import { useSubscription } from "../hooks/use-subscription";
import { SubscribedPanel } from "./subscribed-panel";
import { TrialPanel } from "./trial-panel";

const TRAIL: readonly BreadcrumbStep[] = [
  { label: fr.shell.settings, to: "/reglages" },
  { label: billingFr.title },
];

const organizationNameOnly = (name: string) => name;

const PLAN_SKELETONS = ["solo", "team"] as const;

const SubscriptionSkeleton = () => (
  <div aria-busy="true" aria-label={billingFr.loading} className="flex flex-col gap-5">
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#E3E8EF] bg-white p-4">
      <Skeleton className="h-3.5 w-36" />
      <Skeleton className="h-3 w-full max-w-96" />
      <Skeleton className="h-1.5 w-full rounded-full" />
    </div>
    <Skeleton className="h-12 w-full lg:h-8 lg:w-56" />
    <div className="grid gap-4 lg:grid-cols-2">
      {PLAN_SKELETONS.map((plan) => (
        <Skeleton key={plan} className="h-48 rounded-xl lg:h-72" />
      ))}
    </div>
  </div>
);

const SubscriptionError = ({
  error,
  onRetry,
}: {
  readonly error: unknown;
  readonly onRetry: () => void;
}) => {
  const codeLine = errorCodeLine(apiErrorOf(error));
  return (
    <section
      role="alert"
      className="flex flex-col items-center gap-2.5 rounded-xl border border-[#E3E8EF] bg-white px-6 py-8 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-[#FDECEC]">
        <TriangleAlert aria-hidden="true" className="size-5 text-destructive" strokeWidth={1.8} />
      </span>
      <h2 className="text-[15px] font-bold lg:text-[14px]">{billingFr.loadFailed}</h2>
      <p className="text-[14px] text-[#475569] lg:text-[13px]">
        {billingFr.loadFailedText}
        {codeLine === undefined ? null : ` ${codeLine}`}
      </p>
      <Button type="button" variant="secondary" onClick={onRetry} className="w-full lg:w-auto">
        {fr.errors.retry}
      </Button>
    </section>
  );
};

type SubscriptionScreenProps = {
  readonly isReturningFromCheckout: boolean;
  readonly onCheckoutConfirmed: () => void;
};

export const SubscriptionScreen = ({
  isReturningFromCheckout,
  onCheckoutConfirmed,
}: SubscriptionScreenProps) => {
  const [now] = useState(() => new Date());
  const subscription = useSubscription(checkoutRefetchRule(isReturningFromCheckout));
  const seats = useBillingSeats();
  useCheckoutWelcome(isReturningFromCheckout, subscription.data, onCheckoutConfirmed);
  const { data, refetch } = subscription;
  const retry = useCallback(() => void refetch(), [refetch]);
  const technicianCount = seats.data?.technicianCount ?? null;
  const ownerName = seats.data?.ownerName ?? null;
  return (
    <>
      <DesktopTopBar trail={TRAIL} />
      <MobileTopBar backTo="/reglages" backLabel={billingFr.backToSettings}>
        <span className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-[17px] font-bold">{billingFr.title}</h1>
          <OrganizationSubtitle
            isForDesktop={false}
            className="truncate text-[13px] text-[#64748B]"
            skeletonClassName="mt-1 h-3.5 w-32"
            render={organizationNameOnly}
          />
        </span>
      </MobileTopBar>
      <div className="flex w-full flex-col leading-[normal] gap-3.5 p-4 pb-8 lg:gap-5 lg:p-6">
        <div className="hidden flex-col gap-1 lg:flex">
          <h1 className="text-[20px] font-bold tracking-[-0.015em]">{billingFr.title}</h1>
          <p className="text-[13px] text-[#475569]">{billingFr.intro}</p>
        </div>
        {data === undefined && !subscription.isError ? <SubscriptionSkeleton /> : null}
        {data === undefined && subscription.isError ? (
          <SubscriptionError error={subscription.error} onRetry={retry} />
        ) : null}
        {data !== undefined && data.subscription === null ? (
          <TrialPanel
            subscription={data}
            technicianCount={technicianCount}
            ownerName={ownerName}
            now={now}
          />
        ) : null}
        {data?.subscription === undefined || data.subscription === null ? null : (
          <SubscribedPanel
            subscription={data}
            details={data.subscription}
            technicianCount={technicianCount}
            ownerName={ownerName}
          />
        )}
      </div>
    </>
  );
};
