import { createRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar, type SignedInUser } from "@/components/app-shell/app-sidebar";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import { FormSkeleton } from "@/components/page-skeleton";
import { ensureActiveOrganization } from "@/lib/session";
import { rootRoute } from "./root";

const selectUser = (context: { readonly user: SignedInUser }) => context.user;

const SignedInLayout = () => {
  const user = signedInRoute.useRouteContext({ select: selectUser });
  return (
    <div className="min-h-dvh bg-[#F7F9FB] lg:flex lg:bg-white">
      <AppSidebar user={user} />
      <main className="flex min-h-dvh min-w-0 flex-1 flex-col pb-[84px] lg:pb-0">
        <Outlet />
      </main>
      <MobileTabBar />
    </div>
  );
};

export const signedInRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "signed-in",
  beforeLoad: async ({ location }) => {
    const { user } = await ensureActiveOrganization(location.href);
    return { user: { name: user.name, email: user.email } };
  },
  pendingComponent: () => (
    <main className="mx-auto max-w-screen-sm p-4">
      <FormSkeleton />
    </main>
  ),
  component: SignedInLayout,
});
