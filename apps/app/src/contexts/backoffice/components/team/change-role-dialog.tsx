import type { PlatformRole } from "@passalio/shared";
import { useCallback, useState, type FormEvent } from "react";
import { useChangeTeammateRole } from "../../hooks/use-platform-team";
import { teamFr } from "../../team-fr";
import { RoleChoice } from "./role-choice";
import { TeamDialog } from "./team-dialog";

const text = teamFr.roleDialog;

export type TeammateSummary = {
  readonly id: string;
  readonly name: string;
  readonly role: PlatformRole;
};

type ChangeRoleDialogProps = {
  readonly teammate: TeammateSummary;
  readonly onClose: () => void;
};

export const ChangeRoleDialog = ({ teammate, onClose }: ChangeRoleDialogProps) => {
  const changeRole = useChangeTeammateRole();
  const [role, setRole] = useState<PlatformRole>(teammate.role);
  const { mutate, isPending } = changeRole;
  const changeOpen = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (role === teammate.role) {
        onClose();
        return;
      }
      mutate({ userId: teammate.id, name: teammate.name, role }, { onSuccess: onClose });
    },
    [mutate, onClose, role, teammate],
  );
  return (
    <TeamDialog
      isOpen
      title={text.title(teammate.name)}
      description={text.text(teammate.name)}
      submitLabel={isPending ? text.saving : text.submit}
      isSubmitting={isPending}
      onOpenChange={changeOpen}
      onCancel={onClose}
      onSubmit={submit}
    >
      <RoleChoice
        name="teammate-new-role"
        value={role}
        currentRole={teammate.role}
        onChange={setRole}
      />
    </TeamDialog>
  );
};
