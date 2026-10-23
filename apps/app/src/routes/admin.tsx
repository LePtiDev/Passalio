import { createRoute, Outlet, redirect } from "@tanstack/react-router";
import { useCallback } from "react";
import * as z from "zod";
import {
  ACCOUNT_FILTERS,
  ACCOUNT_TABS,
  AccountScreen,
  AccountsScreen,
  AdminLayout,
  JournalScreen,
  loadAdminAccess,
  OverviewScreen,
  type AccountFilter,
  type AccountTab,
} from "@/contexts/backoffice";
import { ErrorState } from "@/components/error-state";
import { FormSkeleton } from "@/components/page-skeleton";
import { ApiRequestError } from "@/lib/api-client";
import { ADMIN_CODE_PATH, ADMIN_SECURITY_PATH, requireSession } from "@/lib/session";
import { rootRoute } from "./root";

export const adminRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: Outlet,
});

export const adminShellRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  id: "shell",
  beforeLoad: async ({ location }) => {
    await requireSession(location.href);
    const access = await loadAdminAccess();
    if (access.status === "granted") {
      return { admin: access.admin };
    }
    if (access.status === "hidden") {
      throw redirect({ to: "/" });
    }
    if (access.status === "setup") {
      throw redirect({ to: ADMIN_SECURITY_PATH });
    }
    if (access.status === "code") {
      throw redirect({ to: ADMIN_CODE_PATH, search: { retour: location.href } });
    }
    throw new ApiRequestError({ code: "network", traceId: null });
  },
  errorComponent: function AdminUnavailable({ error, reset }) {
    return (
      <main className="mx-auto max-w-screen-sm p-4">
        <ErrorState error={error} onRetry={reset} />
      </main>
    );
  },
  pendingComponent: () => (
    <main className="mx-auto max-w-screen-sm p-4">
      <FormSkeleton />
    </main>
  ),
  component: function AdminShell() {
    const admin = adminShellRoute.useRouteContext({ select: (context) => context.admin });
    return <AdminLayout admin={admin} />;
  },
});

export const adminOverviewRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/",
  component: OverviewScreen,
});

const accountsSearch = z.object({
  filtre: z.enum(ACCOUNT_FILTERS).optional(),
  recherche: z.string().max(120).optional(),
});

export const adminAccountsRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/comptes",
  validateSearch: accountsSearch,
  component: function AdminAccountsRouteScreen() {
    const { filtre, recherche } = adminAccountsRoute.useSearch();
    const navigate = adminAccountsRoute.useNavigate();
    const changeFilter = useCallback(
      (filter: AccountFilter) =>
        void navigate({
          search: (previous) => ({ ...previous, filtre: filter === "all" ? undefined : filter }),
          replace: true,
        }),
      [navigate],
    );
    const changeSearch = useCallback(
      (search: string) =>
        void navigate({
          search: (previous) => ({ ...previous, recherche: search === "" ? undefined : search }),
          replace: true,
        }),
      [navigate],
    );
    return (
      <AccountsScreen
        filter={filtre ?? "all"}
        search={recherche ?? ""}
        onFilterChange={changeFilter}
        onSearchChange={changeSearch}
      />
    );
  },
});

const accountSearch = z.object({ onglet: z.enum(ACCOUNT_TABS).optional() });

export const adminAccountRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/comptes/$accountId",
  validateSearch: accountSearch,
  component: function AdminAccountRouteScreen() {
    const { accountId } = adminAccountRoute.useParams();
    const { onglet } = adminAccountRoute.useSearch();
    const navigate = adminAccountRoute.useNavigate();
    const changeTab = useCallback(
      (tab: AccountTab) =>
        void navigate({
          search: { onglet: tab === "personnel" ? undefined : tab },
          replace: true,
        }),
      [navigate],
    );
    return (
      <AccountScreen accountId={accountId} tab={onglet ?? "personnel"} onTabChange={changeTab} />
    );
  },
});

export const adminJournalRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/journal",
  component: JournalScreen,
});
