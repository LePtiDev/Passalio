import { createRoute, redirect } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { loadAdminAccess } from "@/contexts/backoffice";
import { AuthLayout, TwoFactorCodeForm, TwoFactorSetup, twoFactorFr } from "@/contexts/identity";
import { ADMIN_CODE_PATH, ADMIN_PATH, ADMIN_SECURITY_PATH, requireSession } from "@/lib/session";
import { adminRootRoute } from "./admin";
import { returnToSearch } from "./return-to-search";

export const adminCodeRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: "/code",
  validateSearch: returnToSearch,
  beforeLoad: async ({ location, search }) => {
    await requireSession(location.href);
    const access = await loadAdminAccess();
    if (access.status === "granted") {
      throw redirect({ to: search.retour ?? ADMIN_PATH });
    }
    if (access.status === "hidden") {
      throw redirect({ to: "/" });
    }
    if (access.status === "setup") {
      throw redirect({ to: ADMIN_SECURITY_PATH });
    }
  },
  component: function AdminCodeScreen() {
    const { retour } = adminCodeRoute.useSearch();
    const navigate = adminCodeRoute.useNavigate();
    const open = useCallback(async () => {
      await navigate({ to: retour ?? ADMIN_PATH });
    }, [navigate, retour]);
    return (
      <AuthLayout showcase="admin">
        <TwoFactorCodeForm subtitle={twoFactorFr.code.adminSubtitle} onVerified={open} />
      </AuthLayout>
    );
  },
});

export const adminSecurityRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: "/securite",
  beforeLoad: async ({ location }) => {
    await requireSession(location.href);
    const access = await loadAdminAccess();
    if (access.status === "granted") {
      throw redirect({ to: ADMIN_PATH });
    }
    if (access.status === "hidden") {
      throw redirect({ to: "/" });
    }
    if (access.status === "code") {
      throw redirect({ to: ADMIN_CODE_PATH });
    }
  },
  component: function AdminSecurityScreen() {
    const navigate = adminSecurityRoute.useNavigate();
    const finish = useCallback(() => {
      toast.success(twoFactorFr.activated);
      void navigate({ to: ADMIN_PATH });
    }, [navigate]);
    return (
      <AuthLayout showcase="admin">
        <TwoFactorSetup onDone={finish} />
      </AuthLayout>
    );
  },
});
