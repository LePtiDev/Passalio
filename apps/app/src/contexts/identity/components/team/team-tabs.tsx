import { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { identityFr } from "../../fr";
import { MembersPanel } from "./members-panel";
import { PendingInvitationsPanel } from "./pending-invitations-panel";

const LIST_CLASS =
  "grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-[#EAEFF4] p-1 group-data-[orientation=horizontal]/tabs:h-auto lg:flex lg:justify-start lg:gap-6 lg:rounded-none lg:border-b lg:border-[#E3E8EF] lg:bg-transparent lg:p-0";

const TRIGGER_CLASS =
  "h-10 gap-1.5 rounded-[9px] text-sm font-medium text-[#475569] data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-[#0F2A44] group-data-[variant=default]/tabs-list:data-[state=active]:shadow-[0_1px_2px_rgba(15,42,68,0.1)] lg:-mb-px lg:h-auto lg:flex-none lg:rounded-none lg:border-0 lg:border-b-2 lg:border-transparent lg:px-0 lg:py-2.5 lg:text-[13px] lg:text-[#64748B] lg:data-[state=active]:border-b-[#0F2A44] lg:data-[state=active]:bg-transparent lg:group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none";

const MEMBERS_COUNT_CLASS =
  "rounded-full px-0 text-[#64748B] lg:bg-[#EEF3F8] lg:px-2 lg:py-px lg:text-xs lg:text-[#0F2A44]";

const PENDING_COUNT_CLASS =
  "rounded-full bg-[#FEF3E2] px-[7px] py-px text-xs font-semibold text-[#B45309] lg:px-2";

export type TeamTab = "members" | "pending";

const isTeamTab = (value: string): value is TeamTab => value === "members" || value === "pending";

type TeamTabsProps = {
  readonly tab: TeamTab;
  readonly membersCount: number | null;
  readonly pendingCount: number | null;
  readonly onInvite: (() => void) | null;
  readonly onTabChange: (tab: TeamTab) => void;
};

const text = identityFr.team;

export const TeamTabs = ({
  tab,
  membersCount,
  pendingCount,
  onInvite,
  onTabChange,
}: TeamTabsProps) => {
  const changeTab = useCallback(
    (value: string) => {
      if (isTeamTab(value)) {
        onTabChange(value);
      }
    },
    [onTabChange],
  );
  return (
    <Tabs value={tab} onValueChange={changeTab} className="gap-4 lg:gap-[18px]">
      <TabsList className={LIST_CLASS}>
        <TabsTrigger value="members" className={TRIGGER_CLASS}>
          {text.membersTab}
          {membersCount === null ? null : (
            <span className={MEMBERS_COUNT_CLASS}>{membersCount}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="pending" className={TRIGGER_CLASS}>
          <span className="lg:hidden">{text.pendingTabShort}</span>
          <span className="hidden lg:inline">{text.pendingTab}</span>
          {pendingCount === null || pendingCount === 0 ? null : (
            <span className={PENDING_COUNT_CLASS}>{pendingCount}</span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="members">
        <MembersPanel onInvite={onInvite} />
      </TabsContent>
      <TabsContent value="pending">
        <PendingInvitationsPanel onInvite={onInvite} />
      </TabsContent>
    </Tabs>
  );
};
