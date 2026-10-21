import { useCallback } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { useCan } from "@/lib/permissions/use-can";
import { identityFr } from "../fr";
import { useActor } from "../hooks/use-actor";
import { useTeam } from "../hooks/use-team";
import { INVITE_EMAIL_INPUT_ID } from "./invite-member-form";
import { MemberRow } from "./member-row";
import { TeamListSkeleton } from "./team-list-skeleton";

const focusInviteForm = () => document.getElementById(INVITE_EMAIL_INPUT_ID)?.focus();

export const TeamList = () => {
  const team = useTeam();
  const { data: actor } = useActor();
  const canManage = useCan("members:manage");
  const { refetch, fetchNextPage } = team;
  const retry = useCallback(() => void refetch(), [refetch]);
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);

  if (team.isPending) {
    return <TeamListSkeleton />;
  }
  if (team.isError) {
    return <ErrorState error={team.error} onRetry={retry} />;
  }

  const members = team.data.pages.flatMap((page) => page.members);
  const isAlone = members.length <= 1 && !team.hasNextPage;

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isCurrentUser={member.userId === actor?.userId}
          />
        ))}
      </ul>
      {isAlone ? (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-muted p-4">
          <p className="font-semibold">{identityFr.team.emptyTitle}</p>
          <p className="text-muted-foreground">{identityFr.team.emptyText}</p>
          {canManage ? (
            <Button className="h-12 text-base" onClick={focusInviteForm}>
              {identityFr.team.emptyAction}
            </Button>
          ) : null}
        </div>
      ) : null}
      {team.hasNextPage ? (
        <Button
          variant="outline"
          className="h-12 text-base"
          disabled={team.isFetchingNextPage}
          onClick={loadMore}
        >
          {identityFr.team.loadMore}
        </Button>
      ) : null}
    </div>
  );
};
