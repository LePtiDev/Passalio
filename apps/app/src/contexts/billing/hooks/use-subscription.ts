import type { SubscriptionResponse } from "@passalio/shared";
import { useQuery } from "@tanstack/react-query";
import { unwrap } from "@/lib/api-client";
import { billingApi } from "../billing-api";

export const SUBSCRIPTION_QUERY_KEY = ["billing", "subscription"] as const;

type RefetchRule = (
  subscription: SubscriptionResponse | undefined,
  updateCount: number,
) => number | false;

const NEVER: RefetchRule = () => false;

export const useSubscription = (refetchRule: RefetchRule = NEVER) =>
  useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async () => unwrap(await billingApi.fetchSubscription()),
    refetchInterval: (query) => refetchRule(query.state.data, query.state.dataUpdateCount),
  });
