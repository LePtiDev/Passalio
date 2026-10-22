import { ORGANIZATION_ROLES, type OrganizationRole } from "@passalio/shared";
import { ChevronDown } from "lucide-react";
import { useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { identityFr, ROLE_LABELS } from "../../fr";
import { BADGE_CLASS, ROLE_BADGE_CLASS } from "./team-styles";

const ASSIGNABLE_ROLES = ORGANIZATION_ROLES.filter((role) => role !== "owner");

const toAssignableRole = (value: string): OrganizationRole | undefined =>
  ASSIGNABLE_ROLES.find((role) => role === value);

type MemberRoleMenuProps = {
  readonly name: string;
  readonly role: OrganizationRole;
  readonly isDisabled: boolean;
  readonly onChange: (role: OrganizationRole) => void;
};

export const MemberRoleMenu = ({ name, role, isDisabled, onChange }: MemberRoleMenuProps) => {
  const onValueChange = useCallback(
    (value: string) => {
      const next = toAssignableRole(value);
      if (next !== undefined && next !== role) {
        onChange(next);
      }
    },
    [onChange, role],
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={identityFr.team.roleLabel(name)}
        disabled={isDisabled}
        className="flex h-12 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-auto"
      >
        <span className={cn(BADGE_CLASS, ROLE_BADGE_CLASS[role])}>
          {ROLE_LABELS[role]}
          <ChevronDown aria-hidden="true" className="size-3" strokeWidth={2.4} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuRadioGroup value={role} onValueChange={onValueChange}>
          {ASSIGNABLE_ROLES.map((assignable) => (
            <DropdownMenuRadioItem
              key={assignable}
              value={assignable}
              className="min-h-12 text-base lg:min-h-8 lg:text-[13px]"
            >
              {ROLE_LABELS[assignable]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
