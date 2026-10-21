import { createRoute } from "@tanstack/react-router";
import { FormSkeleton } from "@/components/page-skeleton";
import { CreateOrganizationForm } from "@/contexts/identity";
import { requireSession } from "@/lib/session";
import { PublicLayout } from "./public-layout";
import { rootRoute } from "./root";

export const newOrganizationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/entreprise/nouvelle",
  beforeLoad: ({ location }) => requireSession(location.href),
  pendingComponent: FormSkeleton,
  component: () => (
    <PublicLayout>
      <CreateOrganizationForm />
    </PublicLayout>
  ),
});
