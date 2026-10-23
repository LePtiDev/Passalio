import { useMemo } from "react";

export const useCustomerParams = (customerId: string) =>
  useMemo(() => ({ customerId }), [customerId]);

export const useSiteSearch = (siteId: string) => useMemo(() => ({ lieu: siteId }), [siteId]);
