import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { refreshWhenWorkspaceBlocked } from "./contexts/billing";
import { apiErrorOf } from "./lib/api-client";
import { toastApiError } from "./lib/errors";
import { registerServiceWorker } from "./lib/service-worker";
import { router } from "./router";
import "./styles.css";

const queryClient: QueryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      const apiError = apiErrorOf(error);
      void refreshWhenWorkspaceBlocked(queryClient, apiError);
      if (mutation.meta?.["showsErrorsInline"] !== true) {
        toastApiError(apiError);
      }
    },
  }),
});

registerServiceWorker();

const rootElement = document.querySelector("#root");

if (rootElement !== null) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
