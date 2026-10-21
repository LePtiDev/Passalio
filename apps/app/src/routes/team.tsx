import { createRoute } from "@tanstack/react-router";
import { identityFr, InviteMemberForm, TeamList, TeamListSkeleton } from "@/contexts/identity";
import { useCan } from "@/lib/permissions/use-can";
import { signedInRoute } from "./signed-in-layout";

const TeamScreen = () => {
  const canManage = useCan("members:manage");
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{identityFr.team.title}</h1>
        <p className="text-muted-foreground">{identityFr.team.subtitle}</p>
      </div>
      <TeamList />
      {canManage ? <InviteMemberForm /> : null}
    </section>
  );
};

export const teamRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/equipe",
  pendingComponent: TeamListSkeleton,
  component: TeamScreen,
});
