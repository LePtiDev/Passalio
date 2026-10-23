import { useCallback, useMemo } from "react";
import { ErrorState } from "@/components/error-state";
import { CursorPagination } from "@/components/pagination";
import { usePagedList } from "@/lib/use-paged-list";
import { useCan } from "@/lib/permissions/use-can";
import { cn } from "@/lib/utils";
import { identityFr } from "../../fr";
import { useActor } from "../../hooks/use-actor";
import { usePendingInvitations } from "../../hooks/use-pending-invitations";
import { useTeamPage } from "../../hooks/use-team";
import { MemberRow } from "./member-row";
import { PendingInvitationList } from "./pending-invitation-list";
import { TeamEmptyState } from "./team-empty-state";
import { TeamSkeleton } from "./team-skeleton";
import { MEMBER_GRID_CLASS, TEAM_CARD_CLASS } from "./team-styles";

const text = identityFr.team;

const MEMBER_ROW_HEIGHTS = { mobile: 73, desktop: 57 } as const;

const MembersHeader = () => (
  <div
    aria-hidden="true"
    className={cn(
      MEMBER_GRID_CLASS,
      "hidden border-b border-[#E3E8EF] bg-[#F7F9FB] px-3.5 py-2.5 text-[13px] font-semibold text-[#64748B] lg:grid",
    )}
  >
    <span>{text.personColumn}</span>
    <span>{text.roleColumn}</span>
    <span>{text.joinedColumn}</span>
    <span />
  </div>
);

export const MembersPanel = ({ onInvite }: { readonly onInvite: (() => void) | null }) => {
  const { measureList, ...paging } = usePagedList("team", MEMBER_ROW_HEIGHTS);
  const team = useTeamPage(paging.cursor, paging.pageSize);
  const pending = usePendingInvitations();
  const { data: actor } = useActor();
  const canManage = useCan("members:manage");
  const { refetch } = team;
  const retry = useCallback(() => void refetch(), [refetch]);
  const invitations = useMemo(
    () => pending.data?.pages.flatMap((page) => page.invitations) ?? [],
    [pending.data],
  );

  if (team.isError) {
    return <ErrorState error={team.error} onRetry={retry} />;
  }
  if (team.isPending) {
    return (
      <div ref={measureList}>
        <TeamSkeleton />
      </div>
    );
  }

  const { members, nextCursor } = team.data;
  const isAlone =
    members.length <= 1 && nextCursor === null && paging.page === 0 && invitations.length === 0;

  return (
    <div ref={measureList} className="flex flex-col gap-4">
      <div className={TEAM_CARD_CLASS}>
        <MembersHeader />
        <ul>
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isCurrentUser={member.userId === actor?.userId}
            />
          ))}
        </ul>
        <CursorPagination
          paging={paging}
          nextCursor={nextCursor}
          shown={members.length}
          total={null}
          isLoading={team.isPlaceholderData}
        />
      </div>
      {invitations.length > 0 ? (
        <PendingInvitationList invitations={invitations} canManage={canManage} />
      ) : null}
      {isAlone ? (
        <TeamEmptyState title={text.emptyTitle} text={text.emptyText} onInvite={onInvite} />
      ) : null}
    </div>
  );
};
