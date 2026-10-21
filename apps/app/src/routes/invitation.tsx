import { createRoute } from "@tanstack/react-router";
import { FormSkeleton } from "@/components/page-skeleton";
import { AcceptInvitationCard } from "@/contexts/identity";
import { requireSession } from "@/lib/session";
import { PublicLayout } from "./public-layout";
import { rootRoute } from "./root";

export const invitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invitations/$organizationId/$invitationId",
  beforeLoad: ({ location }) => requireSession(location.href),
  pendingComponent: FormSkeleton,
  component: function InvitationScreen() {
    const { organizationId, invitationId } = invitationRoute.useParams();
    return (
      <PublicLayout>
        <AcceptInvitationCard organizationId={organizationId} invitationId={invitationId} />
      </PublicLayout>
    );
  },
});
