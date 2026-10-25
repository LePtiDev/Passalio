import type { SubscriptionDetailsResponse, SubscriptionResponse } from "@passalio/shared";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatShortDate, formatShortDateWithYear } from "@/lib/format-date";
import { billingFr } from "../billing-fr";
import { useInvoices } from "../hooks/use-billing-details";
import { useBillingPortal } from "../hooks/use-stripe-redirect";
import {
  formatEuros,
  paymentFailedAtOf,
  subscriptionAlertOf,
  subscriptionPriceOf,
} from "../subscription-view";
import { InvoicesTable } from "./invoices-table";
import { SubscriptionNotice } from "./subscription-notice";
import { SubscriptionSummary } from "./subscription-summary";

const text = billingFr.subscribed;
const alerts = billingFr.alerts;

type PanelProps = {
  readonly subscription: SubscriptionResponse;
  readonly details: SubscriptionDetailsResponse;
  readonly technicianCount: number | null;
  readonly ownerName: string | null;
};

const SubscriptionAlert = ({
  subscription,
  details,
  ownerName,
  onOpenPortal,
  isOpening,
}: Omit<PanelProps, "technicianCount"> & {
  readonly onOpenPortal: () => void;
  readonly isOpening: boolean;
}) => {
  const alert = subscriptionAlertOf(subscription);
  if (alert === "member") {
    return (
      <SubscriptionNotice
        tone="info"
        title={alerts.member.title(ownerName)}
        text={alerts.member.text}
      />
    );
  }
  if (alert === "payment_pending") {
    return (
      <SubscriptionNotice
        tone="pending"
        title={alerts.payment_pending.title}
        text={alerts.payment_pending.text}
      />
    );
  }
  if (alert === "payment_failed" && subscription.graceEndsAt !== null) {
    const graceEndsAt = new Date(subscription.graceEndsAt);
    return (
      <SubscriptionNotice
        tone="warning"
        title={alerts.payment_failed.title(
          formatEuros(subscriptionPriceOf(details)),
          formatShortDate(paymentFailedAtOf(graceEndsAt)),
        )}
        text={alerts.payment_failed.text(formatShortDate(graceEndsAt))}
        actionLabel={alerts.payment_failed.action}
        isActionDisabled={isOpening}
        onAction={onOpenPortal}
      />
    );
  }
  if (alert === "cancel_scheduled" && details.currentPeriodEndsAt !== null) {
    return (
      <SubscriptionNotice
        tone="info"
        title={alerts.cancel_scheduled.title(
          formatShortDateWithYear(new Date(details.currentPeriodEndsAt)),
        )}
        text={alerts.cancel_scheduled.text}
        actionLabel={alerts.cancel_scheduled.action}
        isActionDisabled={isOpening}
        onAction={onOpenPortal}
      />
    );
  }
  return null;
};

export const SubscribedPanel = ({
  subscription,
  details,
  technicianCount,
  ownerName,
}: PanelProps) => {
  const { open: openPortal, isOpening } = useBillingPortal();
  const { canManage, workspaceState } = subscription;
  const invoices = useInvoices(canManage);
  return (
    <>
      <SubscriptionAlert
        subscription={subscription}
        details={details}
        ownerName={ownerName}
        onOpenPortal={openPortal}
        isOpening={isOpening}
      />
      <SubscriptionSummary
        details={details}
        workspaceState={workspaceState}
        graceEndsAt={subscription.graceEndsAt === null ? null : new Date(subscription.graceEndsAt)}
        technicianCount={technicianCount}
        canManage={canManage}
      >
        {canManage ? (
          <>
            <Button type="button" variant="secondary" disabled={isOpening} onClick={openPortal}>
              {text.changePlan}
            </Button>
            <Button type="button" variant="secondary" disabled={isOpening} onClick={openPortal}>
              {text.managePayment}
              <ArrowUpRight aria-hidden="true" />
            </Button>
          </>
        ) : null}
      </SubscriptionSummary>
      {canManage ? (
        <>
          <div className="flex flex-col gap-3.5 lg:hidden">
            <Button type="button" variant="secondary" disabled={isOpening} onClick={openPortal}>
              {text.changePlan}
            </Button>
            <Button type="button" variant="secondary" disabled={isOpening} onClick={openPortal}>
              {text.paymentAndInvoices}
              <ArrowUpRight aria-hidden="true" />
            </Button>
            <p className="text-[13px] leading-relaxed text-[#64748B]">{text.mobileNote}</p>
          </div>
          <InvoicesTable
            invoices={invoices.data}
            isError={invoices.isError}
            workspaceState={workspaceState}
          />
          {details.isCancelScheduled ? null : (
            <p className="hidden text-[13px] text-[#64748B] lg:block">
              {text.cancelQuestion}{" "}
              <button
                type="button"
                disabled={isOpening}
                onClick={openPortal}
                className="font-semibold text-[#334155] hover:text-[#0F2A44]"
              >
                {text.cancel}
              </button>
              . {text.cancelNote}
            </p>
          )}
        </>
      ) : null}
    </>
  );
};
