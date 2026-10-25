import { PLANS, type BillingInterval, type Plan } from "@passalio/shared";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl, type Choice } from "@/contexts/customers";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { billingFr, PLAN_NAMES } from "../billing-fr";
import { PLAN_PRICES_EUROS } from "../subscription-view";
import { BillingPill } from "./billing-pill";

const text = billingFr.plans;

type PlanCardProps = {
  readonly plan: Plan;
  readonly interval: BillingInterval;
  readonly recommendation: string | null;
  readonly isDisabled: boolean;
  readonly isOpening: boolean;
  readonly isCompact: boolean;
  readonly onChoose: (plan: Plan) => void;
};

const PlanCard = ({
  plan,
  interval,
  recommendation,
  isDisabled,
  isOpening,
  isCompact,
  onChoose,
}: PlanCardProps) => {
  const choose = useCallback(() => onChoose(plan), [onChoose, plan]);
  const isRecommended = recommendation !== null;
  const price = text.price(PLAN_PRICES_EUROS[plan][interval]);
  const headingId = `plan-${plan}`;
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex flex-col gap-2.5 rounded-xl bg-white p-4 lg:gap-3.5 lg:p-5",
        isRecommended ? "border-2 border-[#0F2A44]" : "border border-[#E3E8EF]",
      )}
    >
      <div className="flex min-h-[22px] items-center gap-2">
        <h3 id={headingId} className="text-[17px] font-bold lg:text-[16px]">
          {PLAN_NAMES[plan]}
        </h3>
        {isRecommended ? (
          <span className={isCompact ? "hidden lg:inline-flex" : "inline-flex"}>
            <BillingPill tone="navy">
              <span className="lg:hidden">{text.recommended}</span>
              <span className="hidden lg:inline">{recommendation}</span>
            </BillingPill>
          </span>
        ) : null}
        <strong className="ml-auto text-[20px] lg:hidden">
          {price}{" "}
          <span className="text-[13px] font-medium text-[#475569]">
            {interval === "month" ? text.perMonthShort : text.perYearShort}
          </span>
        </strong>
      </div>
      <span className="hidden items-baseline gap-1.5 lg:flex">
        <strong className={cn("tracking-[-0.02em]", isCompact ? "text-[26px]" : "text-[28px]")}>
          {price}
        </strong>
        <span className="text-[13px] text-[#475569]">
          {interval === "month" ? text.perMonth : text.perYear}
        </span>
      </span>
      <span
        className={cn(
          "text-[14px] text-[#475569] lg:text-[13px]",
          isCompact ? "hidden lg:inline" : "inline",
        )}
      >
        <span className={isCompact ? "inline" : "lg:hidden"}>{text.shortDescription[plan]}</span>
        {isCompact ? null : <span className="hidden lg:inline">{text.description[plan]}</span>}
      </span>
      <Button
        type="button"
        variant={isRecommended ? "primary" : "secondary"}
        disabled={isDisabled}
        onClick={choose}
      >
        {isOpening ? text.opening : text.choose(plan)}
      </Button>
    </section>
  );
};

type PlanChoiceProps = {
  readonly interval: BillingInterval;
  readonly onIntervalChange: (interval: BillingInterval) => void;
  readonly recommendedPlan: Plan;
  readonly technicianCount: number | null;
  readonly isDisabled: boolean;
  readonly openingPlan: Plan | null;
  readonly isCompact: boolean;
  readonly onChoose: (plan: Plan) => void;
};

const yearLabelOf = (isDesktop: boolean, isCompact: boolean) => {
  if (!isDesktop) {
    return billingFr.interval.yearShort;
  }
  return isCompact ? billingFr.interval.yearWithOffer : billingFr.interval.year;
};

export const PlanChoice = ({
  interval,
  onIntervalChange,
  recommendedPlan,
  technicianCount,
  isDisabled,
  openingPlan,
  isCompact,
  onChoose,
}: PlanChoiceProps) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const intervals = useMemo(
    (): readonly Choice<BillingInterval>[] => [
      { value: "month", label: billingFr.interval.month },
      { value: "year", label: yearLabelOf(isDesktop, isCompact) },
    ],
    [isDesktop, isCompact],
  );
  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-3", isCompact && "lg:justify-center")}>
        <SegmentedControl
          label={billingFr.interval.label}
          choices={intervals}
          value={interval}
          onChange={onIntervalChange}
          className={cn(
            "w-full lg:rounded-[9px] lg:p-0.5",
            isCompact ? "lg:w-[334px]" : "lg:w-[178px]",
          )}
        />
        {isCompact ? null : (
          <span className="hidden lg:inline-flex">
            <BillingPill tone="green">{billingFr.interval.yearOffer}</BillingPill>
          </span>
        )}
      </div>
      <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-4">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan}
            plan={plan}
            interval={interval}
            recommendation={
              plan === recommendedPlan
                ? technicianCount === null
                  ? text.recommended
                  : text.recommendedFor(technicianCount)
                : null
            }
            isDisabled={isDisabled || openingPlan !== null}
            isOpening={openingPlan === plan}
            isCompact={isCompact}
            onChoose={onChoose}
          />
        ))}
      </div>
    </>
  );
};
