import { billingFr } from "../billing-fr";
import { useSubscription } from "./use-subscription";

export const usePlanLabel = (): string | undefined => {
  const { data } = useSubscription();
  if (data === undefined) {
    return undefined;
  }
  return data.subscription === null
    ? billingFr.planLabel.trial
    : billingFr.planLabel.plan(data.subscription.plan, data.subscription.isFounder);
};
