import type { BillingInterval, Plan } from "@passalio/shared";
import { useCallback, useState } from "react";
import { useCheckout } from "./use-stripe-redirect";

export const usePlanCheckout = () => {
  const [interval, changeInterval] = useState<BillingInterval>("month");
  const checkout = useCheckout();
  const { mutate } = checkout;
  const choose = useCallback((plan: Plan) => mutate({ plan, interval }), [mutate, interval]);
  const isLeaving = checkout.isPending || checkout.isSuccess;
  return {
    interval,
    changeInterval,
    choose,
    openingPlan: isLeaving ? (checkout.variables?.plan ?? null) : null,
  };
};
