import type { AccountMembersResponse } from "@passalio/shared";
import { useCallback } from "react";
import { ErrorState } from "@/components/error-state";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/contexts/identity";
import { formatShortDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { lastSeenLabel } from "../../calendar-labels";
import { backofficeFr } from "../../fr";
import { useAccountMembers } from "../../hooks/use-backoffice-queries";
import { useNow } from "../../hooks/use-now";
import { ADMIN_CARD_CLASS, ADMIN_TABLE_HEADER_CLASS } from "../admin-styles";
import { TrendBadge } from "../usage/trend-badge";

const text = backofficeFr.people;

const GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(0,1fr)_140px_140px_130px_150px] lg:gap-4";

const ROLE_CLASS = "inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap";

const CHIP_CLASS = "inline-flex justify-self-start rounded-md px-2 py-0.5 text-xs font-semibold";

type Member = AccountMembersResponse["members"][number];
type Invitation = AccountMembersResponse["invitations"][number];

const securityOf = (member: Member) => {
  if (member.isBlocked) {
    return { label: text.security.blocked, className: "bg-[#FEF3F2] text-[#B42318]" };
  }
  return member.isTwoFactorEnabled
    ? { label: text.security.twoFactor, className: "bg-[#E6F4EE] text-[#0B5B43]" }
    : { label: text.security.password, className: "bg-[#EEF3F8] text-[#334155]" };
};

const MemberRow = ({ member, now }: { readonly member: Member; readonly now: Date }) => {
  const security = securityOf(member);
  return (
    <li
      className={cn(GRID_CLASS, "min-h-16 border-b border-[#EEF2F6] px-4 py-2.5 last:border-b-0")}
    >
      <span className="flex min-w-0 items-center gap-3">
        <InitialsAvatar
          name={member.name}
          tone={member.role === "owner" ? "mint" : "slate"}
          size="medium"
        />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-semibold lg:text-[13px]">{member.name}</span>
          <span className="truncate text-[13px] text-[#64748B] lg:text-xs">
            <span className="lg:hidden">
              {ROLE_LABELS[member.role]} · {lastSeenLabel(member.lastActiveDay, now)}
            </span>
            <span className="hidden lg:inline">{member.email}</span>
          </span>
        </span>
      </span>
      <span className="hidden lg:flex">
        <span
          className={cn(
            ROLE_CLASS,
            member.role === "owner" ? "bg-[#0F2A44] text-white" : "bg-[#EEF3F8] text-[#0F2A44]",
          )}
        >
          {ROLE_LABELS[member.role]}
        </span>
      </span>
      <span className="hidden text-[13px] lg:block">
        {lastSeenLabel(member.lastActiveDay, now)}
      </span>
      <span className="flex items-center justify-end gap-2 tabular-nums lg:justify-start">
        <strong className="text-[15px] lg:text-[13px]">{member.trend.recent}</strong>
        {member.trend.changePercent === null ? null : <TrendBadge trend={member.trend} />}
      </span>
      <span className={cn(CHIP_CLASS, "hidden lg:inline-flex", security.className)}>
        {security.label}
      </span>
    </li>
  );
};

const InvitationRow = ({ invitation }: { readonly invitation: Invitation }) => (
  <li className={cn(GRID_CLASS, "min-h-16 border-b border-[#EEF2F6] px-4 py-2.5 last:border-b-0")}>
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-[#D5DDE6] text-xs font-semibold text-[#94A3B8] lg:size-7">
        @
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] font-semibold lg:text-[13px]">
          {invitation.email}
        </span>
        <span className="truncate text-[13px] text-[#64748B] lg:hidden">
          {ROLE_LABELS[invitation.role]} · {text.notActivated}
        </span>
      </span>
    </span>
    <span className="hidden lg:flex">
      <span className={cn(ROLE_CLASS, "bg-[#EEF3F8] text-[#0F2A44]")}>
        {ROLE_LABELS[invitation.role]}
      </span>
    </span>
    <span className="hidden text-[13px] lg:block">
      {text.invitedOn(formatShortDate(new Date(invitation.createdAt)))}
    </span>
    <span className="hidden lg:block" />
    <span className={cn(CHIP_CLASS, "hidden bg-[#EEF3F8] text-[#334155] lg:inline-flex")}>
      {text.notActivated}
    </span>
  </li>
);

const PeopleSkeleton = () => (
  <div className={ADMIN_CARD_CLASS} aria-busy="true">
    {["a", "b", "c"].map((key) => (
      <div
        key={key}
        className={cn(GRID_CLASS, "min-h-16 border-b border-[#EEF2F6] px-4 py-3 last:border-b-0")}
      >
        <span className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full lg:size-7" />
          <span className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-44" />
          </span>
        </span>
        <Skeleton className="hidden h-6 w-24 rounded-lg lg:block" />
        <Skeleton className="hidden h-3.5 w-20 lg:block" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="hidden h-5 w-24 lg:block" />
      </div>
    ))}
  </div>
);

export const PeoplePanel = ({ accountId }: { readonly accountId: string }) => {
  const members = useAccountMembers(accountId);
  const { refetch } = members;
  const retry = useCallback(() => void refetch(), [refetch]);
  const now = useNow();
  if (members.isPending) {
    return <PeopleSkeleton />;
  }
  if (members.isError) {
    return <ErrorState error={members.error} onRetry={retry} />;
  }
  const { members: people, invitations } = members.data;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-[#475569]">
        {text.summary(people.length, invitations.length)}
      </p>
      <div className={ADMIN_CARD_CLASS}>
        <div aria-hidden="true" className={cn(GRID_CLASS, ADMIN_TABLE_HEADER_CLASS)}>
          <span>{text.columns.person}</span>
          <span>{text.columns.role}</span>
          <span>{text.columns.lastSeen}</span>
          <span>{text.columns.recent}</span>
          <span>{text.columns.security}</span>
        </div>
        {people.length === 0 && invitations.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-[#64748B]">{text.empty}</p>
        ) : (
          <ul>
            {people.map((member) => (
              <MemberRow key={member.userId} member={member} now={now} />
            ))}
            {invitations.map((invitation) => (
              <InvitationRow key={invitation.email} invitation={invitation} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
