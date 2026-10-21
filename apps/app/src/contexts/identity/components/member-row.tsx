import type { OrganizationRole } from "@passalio/shared";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { useCan } from "@/lib/permissions/use-can";
import { identityFr, ROLE_LABELS } from "../fr";
import type { TeamMember } from "../identity-api";
import { useChangeRole, useRemoveMember, useTransferOwnership } from "../hooks/use-team";
import { ConfirmAction } from "./member-actions";
import { RoleSelect } from "./role-select";

type MemberRowProps = {
  readonly member: TeamMember;
  readonly isCurrentUser: boolean;
};

export const MemberRow = ({ member, isCurrentUser }: MemberRowProps) => {
  const canManage = useCan("members:manage");
  const canTransfer = useCan("ownership:transfer");
  const changeRole = useChangeRole();
  const removeMember = useRemoveMember();
  const transferOwnership = useTransferOwnership();
  const isEditable = canManage && member.role !== "owner" && !isCurrentUser;
  const memberId = member.id;
  const name = member.name.trim() === "" ? member.email : member.name;
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

  return (
    <li className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {name}
            {isCurrentUser ? (
              <span className="font-normal text-muted-foreground"> · {identityFr.team.you}</span>
            ) : null}
          </p>
          {name === member.email ? null : (
            <p className="truncate text-sm text-muted-foreground">{member.email}</p>
          )}
        </div>
        {isEditable ? null : <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>}
      </div>
      {isEditable ? (
        <div className="flex flex-col gap-2">
          <RoleSelect
            label={identityFr.team.roleLabel(name)}
            value={member.role}
            isDisabled={changeRole.isPending}
            onChange={onRoleChange}
          />
          <div className="flex flex-wrap gap-2">
            {canTransfer && member.role === "admin" ? (
              <ConfirmAction
                triggerLabel={identityFr.team.transfer}
                title={identityFr.team.transferTitle(name)}
                description={identityFr.team.transferText}
                confirmLabel={identityFr.team.transferConfirm}
                isPending={transferOwnership.isPending}
                onConfirm={onTransfer}
              />
            ) : null}
            <ConfirmAction
              triggerLabel={identityFr.team.remove}
              title={identityFr.team.removeTitle(name)}
              description={identityFr.team.removeText}
              confirmLabel={identityFr.team.removeConfirm}
              isDestructive
              isPending={removeMember.isPending}
              onConfirm={onRemove}
            />
          </div>
        </div>
      ) : null}
    </li>
  );
};
