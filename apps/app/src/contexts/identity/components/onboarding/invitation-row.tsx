import type { OrganizationRole } from "@passalio/shared";
import { X } from "lucide-react";
import { useCallback } from "react";
import { useController, type Control, type UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { onboardingFr } from "../../onboarding-fr";
import { AUTH_ERROR_CLASS, AUTH_FIELD_CLASS } from "../auth-styles";
import { RoleSelect } from "../role-select";
import type { TeamFormValues } from "./team-form-schema";

const text = onboardingFr.team;

type InvitationRowProps = {
  readonly index: number;
  readonly control: Control<TeamFormValues>;
  readonly register: UseFormRegister<TeamFormValues>;
  readonly error: string | undefined;
  readonly canRemove: boolean;
  readonly onRemove: (index: number) => void;
};

export const InvitationRow = ({
  index,
  control,
  register,
  error,
  canRemove,
  onRemove,
}: InvitationRowProps) => {
  const { field } = useController({ control, name: `invitations.${index}.role` });
  const { onChange } = field;
  const changeRole = useCallback((role: OrganizationRole) => onChange(role), [onChange]);
  const remove = useCallback(() => onRemove(index), [index, onRemove]);
  const rowNumber = index + 1;
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
        <Input
          type="email"
          inputMode="email"
          autoComplete="off"
          aria-label={text.emailLabel(rowNumber)}
          aria-invalid={error !== undefined}
          placeholder={text.emailPlaceholder}
          className={`${AUTH_FIELD_CLASS} col-span-2 sm:col-span-1`}
          {...register(`invitations.${index}.email`)}
        />
        <RoleSelect
          value={field.value}
          label={text.roleLabel(rowNumber)}
          onChange={changeRole}
          className="rounded-[10px] border-[#D5DDE6] lg:rounded-lg lg:text-sm lg:data-[size=default]:h-10"
        />
        <button
          type="button"
          aria-label={text.removeRow(rowNumber)}
          onClick={remove}
          disabled={!canRemove}
          className="flex size-12 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-muted hover:text-foreground disabled:opacity-40 lg:size-10"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      {error === undefined ? null : <p className={AUTH_ERROR_CLASS}>{error}</p>}
    </div>
  );
};
