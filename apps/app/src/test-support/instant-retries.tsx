import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createTestQueryClient } from "./render-screen";

export const withInstantRetries = (screen: ReactNode) => {
  const queryClient = createTestQueryClient();
  queryClient.setDefaultOptions({
    queries: { retry: false, retryDelay: 0 },
    mutations: { retry: false },
  });
  return <QueryClientProvider client={queryClient}>{screen}</QueryClientProvider>;
};
