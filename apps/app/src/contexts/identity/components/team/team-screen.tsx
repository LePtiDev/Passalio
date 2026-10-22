import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { DesktopTopBar, MobileTopBar, PageContent } from "@/components/app-shell/page-bars";
import { Button } from "@/components/ui/button";
import { fr } from "@/fr";
import { useCan } from "@/lib/permissions/use-can";
import { identityFr } from "../../fr";
import { useOrganization } from "../../hooks/use-organization";
import { usePendingInvitations } from "../../hooks/use-pending-invitations";
import { useTeam } from "../../hooks/use-team";
import { InviteMemberDialog } from "./invite-member-dialog";
import { TeamTabs, type TeamTab } from "./team-tabs";
import { TEAM_PRIMARY_BUTTON_CLASS } from "./team-styles";

const TRAIL = [{ label: fr.shell.settings, to: "/reglages" }, { label: fr.shell.team }] as const;

const text = identityFr.team;

const countOf = (pageLengths: readonly number[] | undefined, hasMore: boolean) =>
  pageLengths === undefined || hasMore
    ? null
    : pageLengths.reduce((total, length) => total + length, 0);

export const TeamScreen = () => {
  const canManage = useCan("members:manage");
  const { data: organization } = useOrganization();
  const team = useTeam();
  const pending = usePendingInvitations();
  const [tab, setTab] = useState<TeamTab>("members");
  const [isInviteOpen, setInviteOpen] = useState(false);
  const openInvite = useCallback(() => setInviteOpen(true), []);
  const organizationName = organization?.name ?? "";

  const membersCount = countOf(
    team.data?.pages.map((page) => page.members.length),
    team.hasNextPage,
  );
  const pendingCount = countOf(
    pending.data?.pages.map((page) => page.invitations.length),
    pending.hasNextPage,
  );

  return (
    <>
      <DesktopTopBar trail={TRAIL} />
      <MobileTopBar backTo="/reglages" backLabel={text.backToSettings}>
        <span className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-[17px] font-bold">{text.title}</h1>
          <span className="truncate text-[13px] text-[#64748B]">{organizationName}</span>
        </span>
        {canManage ? (
          <button
            type="button"
            onClick={openInvite}
            aria-label={identityFr.invite.title}
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white"
          >
            <Plus aria-hidden="true" className="size-5" strokeWidth={2.2} />
          </button>
        ) : null}
      </MobileTopBar>
      <PageContent>
        <div className="hidden flex-wrap items-end justify-between gap-4 lg:flex">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-[-0.015em]">{text.title}</h1>
            <p className="text-[13px] text-[#475569]">{text.subtitle(organizationName)}</p>
          </div>
          {canManage ? (
            <Button className={TEAM_PRIMARY_BUTTON_CLASS} onClick={openInvite}>
              <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
              {identityFr.invite.title}
            </Button>
          ) : null}
        </div>
        <TeamTabs
          tab={tab}
          membersCount={membersCount}
          pendingCount={pendingCount}
          onInvite={canManage ? openInvite : null}
          onTabChange={setTab}
        />
      </PageContent>
      <InviteMemberDialog isOpen={isInviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
};
