import type { SubscriptionResponse } from "@passalio/shared";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { billingFr } from "../billing-fr";

export const CHECKOUT_POLL_MS = 2000;
export const CHECKOUT_POLL_ATTEMPTS = 15;

export const checkoutRefetchRule =
  (isReturningFromCheckout: boolean) =>
  (subscription: SubscriptionResponse | undefined, updateCount: number): number | false =>
    isReturningFromCheckout &&
    subscription?.subscription === null &&
    updateCount <= CHECKOUT_POLL_ATTEMPTS
      ? CHECKOUT_POLL_MS
      : false;

export const useCheckoutWelcome = (
  isReturningFromCheckout: boolean,
  subscription: SubscriptionResponse | undefined,
  onConfirmed: () => void,
) => {
  const hasWelcomed = useRef(false);
  const plan = subscription?.subscription?.plan;
  useEffect(() => {
    if (!isReturningFromCheckout || plan === undefined || hasWelcomed.current) {
      return;
    }
    hasWelcomed.current = true;
    toast.success(billingFr.subscribed.welcome(plan));
    onConfirmed();
  }, [isReturningFromCheckout, plan, onConfirmed]);
};
