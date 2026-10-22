import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { unwrap } from "@/lib/api-client";
import { identityApi } from "../identity-api";

const SEARCH_DELAY_MS = 300;
const MIN_QUERY_LENGTH = 3;

const useDebouncedValue = (value: string) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [value]);
  return debounced;
};

export const useCompanySearch = (query: string) => {
  const debouncedQuery = useDebouncedValue(query.trim());
  return useQuery({
    queryKey: ["identity", "company-search", debouncedQuery],
    queryFn: async () => unwrap(await identityApi.searchCompanies(debouncedQuery)),
    enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
    staleTime: 60_000,
  });
};
