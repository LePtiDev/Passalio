import { useCallback } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { useCan } from "@/lib/permissions/use-can";
import { identityFr } from "../../fr";
import { usePendingInvitations } from "../../hooks/use-pending-invitations";
import { PendingInvitationList } from "./pending-invitation-list";
import { TeamEmptyState } from "./team-empty-state";
import { TeamSkeleton } from "./team-skeleton";
import { TEAM_SECONDARY_BUTTON_CLASS } from "./team-styles";

const text = identityFr.pendingInvitations;

export const PendingInvitationsPanel = ({
  onInvite,
}: {
  readonly onInvite: (() => void) | null;
}) => {
  const pending = usePendingInvitations();
  const canManage = useCan("members:manage");
  const { refetch, fetchNextPage } = pending;
  const retry = useCallback(() => void refetch(), [refetch]);
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage]);

  if (pending.isPending) {
    return <TeamSkeleton />;
  }
  if (pending.isError) {
    return <ErrorState error={pending.error} onRetry={retry} />;
  }

  const invitations = pending.data.pages.flatMap((page) => page.invitations);
  if (invitations.length === 0) {
    return <TeamEmptyState title={text.emptyTitle} text={text.emptyText} onInvite={onInvite} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <PendingInvitationList invitations={invitations} canManage={canManage} />
      {pending.hasNextPage ? (
        <Button
          variant="outline"
          className={TEAM_SECONDARY_BUTTON_CLASS}
          disabled={pending.isFetchingNextPage}
          onClick={loadMore}
        >
          {identityFr.team.loadMore}
        </Button>
      ) : null}
    </div>
  );
};
