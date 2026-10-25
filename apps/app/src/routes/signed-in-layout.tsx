import { createRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar, type SignedInUser } from "@/components/app-shell/app-sidebar";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { FormSkeleton } from "@/components/page-skeleton";
import { BillingBanner, WorkspaceGate } from "@/contexts/billing";
import { MobileRejectionNotice } from "@/contexts/customers";
import { LocalDatabaseProvider } from "@/lib/db/local-database-context";
import { createRememberedCheck } from "@/lib/remembered-check";
import { loadSignedInSession } from "@/lib/session";
import { useRevalidateOnNavigation } from "@/lib/use-revalidate-on-navigation";
import { rootRoute } from "./root";

type SignedInContext = {
  readonly user: SignedInUser;
  readonly userId: string;
  readonly organizationId: string;
};

const selectContext = ({ user, userId, organizationId }: SignedInContext) => ({
  user,
  userId,
  organizationId,
});

const signedInSession = createRememberedCheck(loadSignedInSession);

const SignedInLayout = () => {
  useRevalidateOnNavigation(signedInSession);
  const { user, userId, organizationId } = signedInRoute.useRouteContext({
    select: selectContext,
  });
  return (
    <LocalDatabaseProvider userId={userId} organizationId={organizationId}>
      <WorkspaceGate email={user.email}>
        <div className="min-h-dvh bg-[#F7F9FB] lg:flex lg:bg-white">
          <AppSidebar user={user} />
          <main className="flex min-h-dvh min-w-0 flex-1 flex-col pb-[84px] lg:pb-0">
            <BillingBanner />
            <Outlet />
          </main>
          <MobileRejectionNotice />
          <MobileTabBar />
        </div>
      </WorkspaceGate>
    </LocalDatabaseProvider>
  );
};

export const signedInRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "signed-in",
  beforeLoad: async ({ location }) => {
    const { userId, name, email, organizationId } = await signedInSession.read(location.href);
    return { user: { name, email }, userId, organizationId };
  },
  pendingComponent: () => (
    <main className="mx-auto max-w-screen-sm p-4">
      <FormSkeleton />
    </main>
  ),
  component: SignedInLayout,
});
