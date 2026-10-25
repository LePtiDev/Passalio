import { skipToken, useQuery } from "@tanstack/react-query";
import { unwrap } from "@/lib/api-client";
import { callsApi, type CallSeriesScope } from "../calls-api";
import { SALES_KEY } from "./use-sales-queries";

export const useMyDay = (isEnabled = true) =>
  useQuery({
    queryKey: [...SALES_KEY, "my-day"],
    queryFn: async () => unwrap(await callsApi.fetchMyDay()),
    enabled: isEnabled,
  });

export const useCallSeries = (scope: CallSeriesScope | null) =>
  useQuery({
    queryKey: [...SALES_KEY, "call-series", scope],
    queryFn: scope === null ? skipToken : async () => unwrap(await callsApi.fetchSeries(scope)),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

export const useFollowUp = (companyId: string | null) =>
  useQuery({
    queryKey: [...SALES_KEY, "follow-up", companyId],
    queryFn:
      companyId === null ? skipToken : async () => unwrap(await callsApi.fetchFollowUp(companyId)),
  });
