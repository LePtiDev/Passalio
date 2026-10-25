import type { ReactNode } from "react";
import type { SubscriptionDetailsResponse, WorkspaceState } from "@passalio/shared";
import { formatShortDateWithYear } from "@/lib/format-date";
import { billingFr } from "../billing-fr";
import {
  formatEuros,
  subscriptionBadgeOf,
  subscriptionPriceOf,
  type SubscriptionBadge,
} from "../subscription-view";
import { BillingPill, type PillTone } from "./billing-pill";

const text = billingFr.subscribed;

const BADGE_TONES: Readonly<Record<SubscriptionBadge, PillTone>> = {
  active: "green",
  payment_pending: "blue",
  payment_failed: "amber",
  ending: "slate",
};

const paymentMethodLabel = (method: SubscriptionDetailsResponse["paymentMethod"]) => {
  if (method === null) {
    return text.noMethod;
  }
  if (method.type === "card") {
    return text.card(method.last4);
  }
  return method.type === "sepa_debit" ? text.sepa(method.last4) : text.otherMethod;
};

type Term = { readonly label: string; readonly value: string };

const periodTermOf = (
  details: SubscriptionDetailsResponse,
  workspaceState: WorkspaceState,
  graceEndsAt: Date | null,
): Term | null => {
  if (workspaceState === "payment_failed" && graceEndsAt !== null) {
    return { label: text.accessUntil, value: formatShortDateWithYear(graceEndsAt) };
  }
  if (details.currentPeriodEndsAt === null) {
    return null;
  }
  const periodEnd = formatShortDateWithYear(new Date(details.currentPeriodEndsAt));
  return details.isCancelScheduled
    ? { label: text.endOfSubscription, value: periodEnd }
    : {
        label: text.nextPayment,
        value: text.nextPaymentValue(periodEnd, formatEuros(subscriptionPriceOf(details))),
      };
};

type SubscriptionSummaryProps = {
  readonly details: SubscriptionDetailsResponse;
  readonly workspaceState: WorkspaceState;
  readonly graceEndsAt: Date | null;
  readonly technicianCount: number | null;
  readonly canManage: boolean;
  readonly children: ReactNode;
};

export const SubscriptionSummary = ({
  details,
  workspaceState,
  graceEndsAt,
  technicianCount,
  canManage,
  children,
}: SubscriptionSummaryProps) => {
  const isYearly = details.interval === "year";
  const badge = subscriptionBadgeOf(workspaceState, details.isCancelScheduled);
  const periodEnd =
    details.currentPeriodEndsAt === null ? null : new Date(details.currentPeriodEndsAt);
  const terms: readonly Term[] = [
    periodTermOf(details, workspaceState, graceEndsAt),
    canManage
      ? { label: text.paymentMethod, value: paymentMethodLabel(details.paymentMethod) }
      : null,
    technicianCount === null
      ? null
      : {
          label: text.technicians,
          value:
            details.plan === "solo"
              ? text.soloTechnicians(technicianCount)
              : text.teamTechnicians(technicianCount),
        },
  ].filter((term) => term !== null);
  return (
    <section
      aria-labelledby="plan-title"
      className="overflow-hidden rounded-xl border border-[#E3E8EF] bg-white"
    >
      <div className="flex items-center gap-2.5 p-3.5 lg:p-4">
        <span className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <h2 id="plan-title" className="text-[17px] font-bold lg:text-base">
              {text.title(details.plan, isYearly, details.isFounder)}
            </h2>
            <BillingPill tone={BADGE_TONES[badge]}>
              {badge === "ending" && periodEnd !== null
                ? text.endsOn(formatShortDateWithYear(periodEnd))
                : text.badges[badge]}
            </BillingPill>
          </span>
          <span className="text-sm text-[#475569] lg:text-[13px]">
            {text.priceLine(subscriptionPriceOf(details), isYearly)}
            <span className="hidden lg:inline"> {text.planLine(details.plan)}</span>
          </span>
        </span>
        <span className="ml-auto hidden gap-2 lg:flex">{children}</span>
      </div>
      <dl className="grid border-t border-[#E3E8EF] text-sm lg:auto-cols-fr lg:grid-flow-col lg:bg-[#F7F9FB] lg:text-[13px]">
        {terms.map((term) => (
          <div
            key={term.label}
            className="flex justify-between gap-3 border-b border-[#EEF2F6] px-3.5 py-3 last:border-b-0 lg:flex-col lg:justify-start lg:gap-1 lg:border-b-0 lg:border-l lg:border-[#E3E8EF] lg:px-4 lg:first:border-l-0"
          >
            <dt className="text-[#64748B] lg:text-xs lg:font-semibold">{term.label}</dt>
            <dd className="text-right font-semibold lg:text-left">{term.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
