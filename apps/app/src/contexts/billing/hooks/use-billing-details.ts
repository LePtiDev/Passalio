import { skipToken, useQuery } from "@tanstack/react-query";
import { unwrap } from "@/lib/api-client";
import { billingApi } from "../billing-api";

export const SEATS_QUERY_KEY = ["billing", "seats"] as const;
export const INVOICES_QUERY_KEY = ["billing", "invoices"] as const;

export const useBillingSeats = () =>
  useQuery({
    queryKey: SEATS_QUERY_KEY,
    queryFn: async () => unwrap(await billingApi.fetchSeats()),
  });

export const useInvoices = (isEnabled: boolean) =>
  useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: isEnabled ? async () => unwrap(await billingApi.fetchInvoices()) : skipToken,
  });
