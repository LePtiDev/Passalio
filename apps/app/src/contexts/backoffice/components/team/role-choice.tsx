import { PLATFORM_ROLES, type PlatformRole } from "@passalio/shared";
import { useCallback, type ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PLATFORM_ROLE_DESCRIPTIONS, PLATFORM_ROLE_LABELS, teamFr } from "../../team-fr";

type RoleChoiceProps = {
  readonly name: string;
  readonly value: PlatformRole;
  readonly currentRole?: PlatformRole;
  readonly onChange: (role: PlatformRole) => void;
};

const roleOf = (value: string) => PLATFORM_ROLES.find((role) => role === value);

export const RoleChoice = ({ name, value, currentRole, onChange }: RoleChoiceProps) => {
  const change = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const role = roleOf(event.target.value);
      if (role !== undefined) {
        onChange(role);
      }
    },
    [onChange],
  );
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-3.5 text-[13px] font-semibold lg:sr-only">
        {teamFr.inviteDialog.roleLabel}
      </legend>
      {PLATFORM_ROLES.map((role) => {
        const isSelected = role === value;
        return (
          <div
            key={role}
            className={cn(
              "relative rounded-[10px] border",
              isSelected
                ? "border-[#0E7C5A] bg-[#F3FAF7] shadow-[0_0_0_3px_rgba(14,124,90,0.15)]"
                : "border-[#D5DDE6] bg-white",
            )}
          >
            <input
              id={`${name}-${role}`}
              type="radio"
              name={name}
              value={role}
              checked={isSelected}
              onChange={change}
              className="absolute top-3.5 left-3.5 size-[18px] accent-[#0E7C5A]"
            />
            <Label
              htmlFor={`${name}-${role}`}
              className="flex cursor-pointer flex-col items-start gap-0.5 py-3 pr-3.5 pl-11 text-left"
            >
              <span className="text-sm font-bold">
                {PLATFORM_ROLE_LABELS[role]}
                {role === currentRole ? (
                  <span className="font-medium text-[#64748B]"> · {teamFr.roleDialog.current}</span>
                ) : null}
              </span>
              <span className="text-[15px] leading-[1.45] font-normal text-[#475569] lg:text-[13px]">
                {PLATFORM_ROLE_DESCRIPTIONS[role]}
              </span>
            </Label>
          </div>
        );
      })}
    </fieldset>
  );
};
