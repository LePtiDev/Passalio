import { createRoute, Outlet } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { FormSkeleton } from "@/components/page-skeleton";
import { ensureActiveOrganization } from "@/lib/session";
import { rootRoute } from "./root";

export const signedInRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "signed-in",
  beforeLoad: ({ location }) => ensureActiveOrganization(location.href),
  pendingComponent: () => (
    <main className="mx-auto max-w-screen-sm p-4">
      <FormSkeleton />
    </main>
  ),
  component: () => (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-screen-sm p-4">
        <Outlet />
      </main>
    </div>
  ),
});
