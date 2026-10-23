import { createRoute, redirect } from "@tanstack/react-router";
import { AuthorizeClaudeScreen, loadAdminAccess } from "@/contexts/backoffice";
import { ApiRequestError } from "@/lib/api-client";
import { ADMIN_CODE_PATH, ADMIN_SECURITY_PATH, requireSession } from "@/lib/session";
import { adminRootRoute } from "./admin";

export const adminMcpAuthorizeRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: "/mcp/autoriser",
  beforeLoad: async ({ location }) => {
    const session = await requireSession(location.href);
    const access = await loadAdminAccess();
    if (access.status === "hidden") {
      throw redirect({ to: "/" });
    }
    if (access.status === "setup") {
      throw redirect({ to: ADMIN_SECURITY_PATH });
    }
    if (access.status === "code") {
      throw redirect({ to: ADMIN_CODE_PATH, search: { retour: location.href } });
    }
    if (access.status === "unavailable") {
      throw new ApiRequestError({ code: "network", traceId: null });
    }
    return { email: session.user.email };
  },
  component: function AdminMcpAuthorizeScreen() {
    const { email } = adminMcpAuthorizeRoute.useRouteContext();
    return <AuthorizeClaudeScreen query={window.location.search} email={email} />;
  },
});
