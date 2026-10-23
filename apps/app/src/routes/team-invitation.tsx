import { createRoute } from "@tanstack/react-router";
import { JoinTeamCard } from "@/contexts/backoffice";
import { AuthLayout } from "@/contexts/identity";
import { FormSkeleton } from "@/components/page-skeleton";
import { requireSession } from "@/lib/session";
import { rootRoute } from "./root";

export const teamInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/equipe-passalio/invitations/$invitationId",
  beforeLoad: async ({ location }) => {
    const session = await requireSession(location.href);
    return { email: session.user.email, returnTo: location.href };
  },
  pendingComponent: FormSkeleton,
  component: function TeamInvitationScreen() {
    const { invitationId } = teamInvitationRoute.useParams();
    const { email, returnTo } = teamInvitationRoute.useRouteContext();
    return (
      <AuthLayout showcase="admin">
        <JoinTeamCard invitationId={invitationId} currentEmail={email} returnTo={returnTo} />
      </AuthLayout>
    );
  },
});
