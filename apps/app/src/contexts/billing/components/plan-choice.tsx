import { PLANS, type BillingInterval, type Plan } from "@passalio/shared";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl, type Choice } from "@/contexts/customers";
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
  readonly onChoose: (plan: Plan) => void;
};

const PlanCard = ({
  plan,
  interval,
  recommendation,
  isDisabled,
  isOpening,
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
        <h3 id={headingId} className="text-[17px] font-bold lg:text-base">
          {PLAN_NAMES[plan]}
        </h3>
        {isRecommended ? (
          <BillingPill tone="navy">
            <span className="lg:hidden">{text.recommended}</span>
            <span className="hidden lg:inline">{recommendation}</span>
          </BillingPill>
        ) : null}
        <strong className="ml-auto text-xl lg:hidden">
          {price}{" "}
          <span className="text-[13px] font-medium text-[#475569]">
            {interval === "month" ? text.perMonthShort : text.perYearShort}
          </span>
        </strong>
      </div>
      <span className="hidden items-baseline gap-1.5 lg:flex">
        <strong className="text-[28px] tracking-[-0.02em]">{price}</strong>
        <span className="text-[13px] text-[#475569]">
          {interval === "month" ? text.perMonth : text.perYear}
        </span>
      </span>
      <span className="text-sm text-[#475569] lg:text-[13px]">
        <span className="lg:hidden">{text.shortDescription[plan]}</span>
        <span className="hidden lg:inline">{text.description[plan]}</span>
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
  readonly onChoose: (plan: Plan) => void;
};

export const PlanChoice = ({
  interval,
  onIntervalChange,
  recommendedPlan,
  technicianCount,
  isDisabled,
  openingPlan,
  onChoose,
}: PlanChoiceProps) => {
  const intervals = useMemo(
    (): readonly Choice<BillingInterval>[] => [
      { value: "month", label: billingFr.interval.month },
      { value: "year", label: billingFr.interval.year },
    ],
    [],
  );
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label={billingFr.interval.label}
          choices={intervals}
          value={interval}
          onChange={onIntervalChange}
          className="w-full lg:w-60"
        />
        <BillingPill tone="green">{billingFr.interval.yearOffer}</BillingPill>
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
            onChoose={onChoose}
          />
        ))}
      </div>
    </>
  );
};
