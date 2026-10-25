import { TRIAL_DAYS, type SubscriptionResponse } from "@passalio/shared";
import { Check } from "lucide-react";
import { billingFr } from "../billing-fr";
import { usePlanCheckout } from "../hooks/use-plan-checkout";
import { recommendedPlanOf, trialProgressOf } from "../subscription-view";
import { BillingPill } from "./billing-pill";
import { PlanChoice } from "./plan-choice";
import { SubscriptionNotice } from "./subscription-notice";

const text = billingFr.trial;

const WEEKDAY_DATE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const DAY_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

const TrialCard = ({ trialEndsAt, now }: { readonly trialEndsAt: Date; readonly now: Date }) => {
  const { daysLeft, daysUsed } = trialProgressOf(trialEndsAt, now);
  return (
    <section
      aria-labelledby="trial-title"
      className="flex flex-col gap-2 rounded-xl border border-[#E3E8EF] bg-white p-3.5 lg:gap-2.5 lg:p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="trial-title" className="text-[15px] font-bold lg:text-sm">
          {text.title}
        </h2>
        <BillingPill tone="blue">{text.daysLeft(daysLeft)}</BillingPill>
        <span className="ml-auto hidden text-[13px] text-[#475569] lg:inline">
          {text.until(WEEKDAY_DATE.format(trialEndsAt))}
        </span>
      </div>
      <progress
        aria-label={text.progressLabel}
        max={TRIAL_DAYS}
        value={daysUsed}
        className="h-1.5 w-full appearance-none overflow-hidden rounded-full bg-[#EEF2F6] [&::-moz-progress-bar]:bg-[#1D4F91] [&::-webkit-progress-bar]:bg-[#EEF2F6] [&::-webkit-progress-value]:bg-[#1D4F91]"
      />
      <p className="text-sm leading-relaxed text-[#475569] lg:text-[13px]">
        <span className="lg:hidden">{text.mobileText(DAY_DATE.format(trialEndsAt))}</span>
        <span className="hidden lg:inline">{text.text}</span>
      </p>
    </section>
  );
};

const IncludedFeatures = () => (
  <section
    aria-labelledby="included-title"
    className="hidden flex-col gap-2.5 rounded-xl bg-[#F7F9FB] p-4 lg:flex"
  >
    <h3 id="included-title" className="text-[13px] font-bold">
      {billingFr.included.title}
    </h3>
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
      {billingFr.included.items.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <Check aria-hidden="true" className="size-3.5 text-[#0E7C5A]" strokeWidth={2.2} />
          {item}
        </li>
      ))}
    </ul>
  </section>
);

type TrialPanelProps = {
  readonly subscription: SubscriptionResponse;
  readonly technicianCount: number | null;
  readonly ownerName: string | null;
  readonly now: Date;
};

export const TrialPanel = ({ subscription, technicianCount, ownerName, now }: TrialPanelProps) => {
  const checkout = usePlanCheckout();
  const { isBillingEnabled, canManage } = subscription;
  return (
    <>
      {isBillingEnabled ? (
        <TrialCard trialEndsAt={new Date(subscription.trialEndsAt)} now={now} />
      ) : (
        <SubscriptionNotice
          tone="info"
          title={billingFr.billingDisabled.title}
          text={billingFr.billingDisabled.text}
        />
      )}
      {canManage ? null : (
        <SubscriptionNotice
          tone="info"
          title={billingFr.alerts.member.title(ownerName)}
          text={billingFr.alerts.member.text}
        />
      )}
      <PlanChoice
        interval={checkout.interval}
        onIntervalChange={checkout.changeInterval}
        recommendedPlan={recommendedPlanOf(technicianCount ?? 1)}
        technicianCount={technicianCount}
        isDisabled={!isBillingEnabled || !canManage}
        openingPlan={checkout.openingPlan}
        onChoose={checkout.choose}
      />
      <IncludedFeatures />
      <p className="text-[13px] leading-relaxed text-[#64748B] lg:text-xs">
        <span className="lg:hidden">{billingFr.paymentNoteShort}</span>
        <span className="hidden lg:inline">{billingFr.paymentNote}</span>
      </p>
    </>
  );
};
