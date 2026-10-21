import { ORGANIZATION_ROLES, type OrganizationRole } from "@passalio/shared";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "../fr";

const ASSIGNABLE_ROLES = ORGANIZATION_ROLES.filter((role) => role !== "owner");

const toAssignableRole = (value: string): OrganizationRole | undefined =>
  ASSIGNABLE_ROLES.find((role) => role === value);

type RoleSelectProps = {
  readonly id?: string;
  readonly value: OrganizationRole;
  readonly label: string;
  readonly isDisabled?: boolean;
  readonly onChange: (role: OrganizationRole) => void;
};

export const RoleSelect = ({ id, value, label, isDisabled = false, onChange }: RoleSelectProps) => {
  const onValueChange = useCallback(
    (next: string) => {
      const role = toAssignableRole(next);
      if (role !== undefined) {
        onChange(role);
      }
    },
    [onChange],
  );
  return (
    <Select value={value} disabled={isDisabled} onValueChange={onValueChange}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className="h-12 w-full text-base data-[size=default]:h-12"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSIGNABLE_ROLES.map((role) => (
          <SelectItem key={role} value={role} className="min-h-12 text-base">
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
