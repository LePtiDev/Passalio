import type { OrganizationRole } from "@passalio/shared";
import { useCallback } from "react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { formatShortDateWithYear } from "@/lib/format-date";
import { useCan } from "@/lib/permissions/use-can";
import { cn } from "@/lib/utils";
import { identityFr, ROLE_LABELS } from "../../fr";
import { useChangeRole, useRemoveMember, useTransferOwnership } from "../../hooks/use-team";
import type { TeamMember } from "../../identity-api";
import { MemberActionsMenu } from "./member-actions-menu";
import { MemberRoleMenu } from "./member-role-menu";
import { BADGE_CLASS, MEMBER_GRID_CLASS, ROLE_AVATAR_TONE, ROLE_BADGE_CLASS } from "./team-styles";

type MemberRowProps = {
  readonly member: TeamMember;
  readonly isCurrentUser: boolean;
};

export const displayNameOf = (member: Pick<TeamMember, "name" | "email">) =>
  member.name.trim() === "" ? member.email : member.name;

export const MemberRow = ({ member, isCurrentUser }: MemberRowProps) => {
  const canManage = useCan("members:manage");
  const canTransfer = useCan("ownership:transfer");
  const changeRole = useChangeRole();
  const removeMember = useRemoveMember();
  const transferOwnership = useTransferOwnership();
  const isEditable = canManage && member.role !== "owner" && !isCurrentUser;
  const memberId = member.id;
  const name = displayNameOf(member);
  const { mutate: changeRoleTo } = changeRole;
  const { mutate: removeNow } = removeMember;
  const { mutate: transferNow } = transferOwnership;
  const onRoleChange = useCallback(
    (role: OrganizationRole) => changeRoleTo({ memberId, name, role }),
    [changeRoleTo, memberId, name],
  );
  const onRemove = useCallback(() => removeNow({ memberId, name }), [removeNow, memberId, name]);
  const onTransfer = useCallback(
    () => transferNow({ memberId, name }),
    [transferNow, memberId, name],
  );
  const isBusy = changeRole.isPending || removeMember.isPending || transferOwnership.isPending;

  return (
    <li
      className={cn(
        MEMBER_GRID_CLASS,
        "min-h-16 border-b border-[#EEF2F6] py-2 pr-1.5 pl-3.5 last:border-b-0 lg:min-h-0 lg:pr-3.5",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <InitialsAvatar name={name} tone={ROLE_AVATAR_TONE[member.role]} size="medium" />
        <div className="flex min-w-0 flex-col gap-px">
          <span className="truncate text-[15px] font-semibold lg:text-[13px]">
            {name}
            {isCurrentUser ? (
              <span className="font-medium text-[#64748B]"> {identityFr.team.you}</span>
            ) : null}
          </span>
          {name === member.email ? null : (
            <span className="truncate text-[13px] text-[#64748B]">{member.email}</span>
          )}
        </div>
      </div>
      <div className="flex">
        {isEditable ? (
          <MemberRoleMenu
            name={name}
            role={member.role}
            isDisabled={isBusy}
            onChange={onRoleChange}
          />
        ) : (
          <span className={cn(BADGE_CLASS, ROLE_BADGE_CLASS[member.role])}>
            {ROLE_LABELS[member.role]}
          </span>
        )}
      </div>
      <span className="hidden text-[13px] text-[#475569] tabular-nums lg:block">
        {formatShortDateWithYear(member.joinedAt)}
      </span>
      <div className="flex justify-end">
        {isEditable ? (
          <MemberActionsMenu
            name={name}
            canTransfer={canTransfer && member.role === "admin"}
            isDisabled={isBusy}
            onTransfer={onTransfer}
            onRemove={onRemove}
          />
        ) : null}
      </div>
    </li>
  );
};
