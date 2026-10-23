import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { apiErrorOf } from "@/lib/api-client";
import { LocalDatabaseProvider } from "@/lib/db/local-database-context";
import { localDatabaseOf } from "@/lib/db/local-database";
import { toastApiError } from "@/lib/errors";

export type RenderScreenOptions = {
  readonly path?: string;
  readonly userId?: string;
  readonly organizationId?: string;
};

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.["showsErrorsInline"] !== true) {
          toastApiError(apiErrorOf(error));
        }
      },
    }),
  });

export const renderScreen = (screen: ReactNode, options: RenderScreenOptions = {}) => {
  const userId = options.userId ?? "user-1";
  const organizationId = options.organizationId ?? `organization-${crypto.randomUUID()}`;
  const database = localDatabaseOf(organizationId);
  const queryClient = createTestQueryClient();
  const rootRoute = createRootRoute({
    component: () => (
      <LocalDatabaseProvider userId={userId} organizationId={organizationId}>
        {screen}
        <Toaster />
      </LocalDatabaseProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [options.path ?? "/"] }),
  });
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...result, user, router, queryClient, database, actor: { userId, organizationId } };
};
