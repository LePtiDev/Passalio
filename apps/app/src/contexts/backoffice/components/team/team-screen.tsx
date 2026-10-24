import type { TeammateResponse } from "@passalio/shared";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlatformTeam } from "../../hooks/use-platform-team";
import { useNow } from "../../hooks/use-now";
import { teamFr } from "../../team-fr";
import { ADMIN_CARD_CLASS, ADMIN_TABLE_HEADER_CLASS } from "../admin-styles";
import { AdminHeading, AdminPage, type AdminTrailStep } from "../shell/admin-page";
import { ChangeRoleDialog, type TeammateSummary } from "./change-role-dialog";
import { InviteTeammateDialog } from "./invite-teammate-dialog";
import { RemoveTeammateDialog } from "./remove-teammate-dialog";
import { TeamInvitationRow } from "./team-invitation-row";
import { TeamSkeleton } from "./team-skeleton";
import { TEAM_GRID_CLASS } from "./team-styles";
import { TeammateRow } from "./teammate-row";

const selfFirst = (members: readonly TeammateResponse[], currentUserId: string) => [
  ...members.filter((member) => member.id === currentUserId),
  ...members.filter((member) => member.id !== currentUserId),
];

const TRAIL: readonly AdminTrailStep[] = [{ label: teamFr.title }];

const SECTION_TITLE_CLASS = "text-[15px] font-bold";

type OpenDialog =
  | { readonly kind: "invite" }
  | { readonly kind: "role"; readonly teammate: TeammateSummary }
  | { readonly kind: "remove"; readonly teammate: TeammateSummary }
  | null;

const InviteButton = ({
  onClick,
  className,
}: {
  readonly onClick: () => void;
  readonly className: string;
}) => (
  <Button className={className} onClick={onClick}>
    <Plus aria-hidden="true" />
    {teamFr.invite}
  </Button>
);

export const TeamScreen = ({ currentUserId }: { readonly currentUserId: string }) => {
  const team = usePlatformTeam();
  const now = useNow();
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const { refetch } = team;
  const retry = useCallback(() => void refetch(), [refetch]);
  const openInvite = useCallback(() => setDialog({ kind: "invite" }), []);
  const closeDialog = useCallback(() => setDialog(null), []);
  const changeInviteOpen = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setDialog(null);
    }
  }, []);
  const openRole = useCallback(
    (teammate: TeammateSummary) => setDialog({ kind: "role", teammate }),
    [],
  );
  const openRemove = useCallback(
    (teammate: TeammateSummary) => setDialog({ kind: "remove", teammate }),
    [],
  );

  const members = selfFirst(team.data?.members ?? [], currentUserId);
  const invitations = team.data?.invitations ?? [];
  return (
    <AdminPage
      trail={TRAIL}
      mobileTitle={teamFr.title}
      mobileSubtitle={team.isSuccess ? teamFr.mobileSubtitle(members.length) : undefined}
    >
      <AdminHeading
        title={teamFr.title}
        subtitle={
          team.isSuccess
            ? teamFr.subtitle(members.length, invitations.length)
            : teamFr.subtitleLoading
        }
      >
        <InviteButton onClick={openInvite} className="" />
      </AdminHeading>
      <InviteButton onClick={openInvite} className="lg:hidden" />
      {team.isPending ? <TeamSkeleton /> : null}
      {team.isError ? (
        <ErrorState error={team.error} onRetry={retry} message={teamFr.loadError} />
      ) : null}
      {team.isSuccess ? (
        <>
          <section className="flex flex-col gap-2.5">
            <h2 className={cn(SECTION_TITLE_CLASS, "lg:hidden")}>{teamFr.membersTitle}</h2>
            <div className={ADMIN_CARD_CLASS}>
              <div
                aria-hidden="true"
                className={cn(TEAM_GRID_CLASS, ADMIN_TABLE_HEADER_CLASS, "leading-[1.3]")}
              >
                <span>{teamFr.columns.member}</span>
                <span>{teamFr.columns.role}</span>
                <span>{teamFr.columns.lastSignIn}</span>
                <span>{teamFr.columns.twoFactor}</span>
                <span />
              </div>
              <ul>
                {members.map((teammate) => (
                  <TeammateRow
                    key={teammate.id}
                    teammate={teammate}
                    isSelf={teammate.id === currentUserId}
                    now={now}
                    onChangeRole={openRole}
                    onRemove={openRemove}
                  />
                ))}
              </ul>
            </div>
          </section>
          <section className="flex flex-col gap-2.5">
            <h2 className={SECTION_TITLE_CLASS}>{teamFr.invitationsTitle}</h2>
            <div className={ADMIN_CARD_CLASS}>
              {invitations.length === 0 ? (
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <p className="text-[15px] text-[#475569] lg:text-[13px]">{teamFr.noInvitation}</p>
                  <Button
                    variant="secondary"
                    className="hidden lg:ml-auto lg:inline-flex"
                    onClick={openInvite}
                  >
                    <Plus aria-hidden="true" />
                    {teamFr.invite}
                  </Button>
                </div>
              ) : (
                <ul>
                  {invitations.map((invitation) => (
                    <TeamInvitationRow key={invitation.id} invitation={invitation} now={now} />
                  ))}
                </ul>
              )}
            </div>
          </section>
          <p className="text-[13px] text-[#64748B] lg:hidden">{teamFr.mobileHint}</p>
        </>
      ) : null}
      <InviteTeammateDialog isOpen={dialog?.kind === "invite"} onOpenChange={changeInviteOpen} />
      {dialog?.kind === "role" ? (
        <ChangeRoleDialog teammate={dialog.teammate} onClose={closeDialog} />
      ) : null}
      {dialog?.kind === "remove" ? (
        <RemoveTeammateDialog teammate={dialog.teammate} onClose={closeDialog} />
      ) : null}
    </AdminPage>
  );
};
