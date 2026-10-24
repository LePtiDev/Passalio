import { useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useRemoveTeammate } from "../../hooks/use-platform-team";
import { teamFr } from "../../team-fr";
import type { TeammateSummary } from "./change-role-dialog";
import {
  DIALOG_OVERLAY_CLASS,
  DIALOG_SHADOW_CLASS,
  DIALOG_TEXT_CLASS,
  DIALOG_TITLE_CLASS,
} from "./team-styles";

const text = teamFr.removeDialog;

type RemoveTeammateDialogProps = {
  readonly teammate: TeammateSummary;
  readonly onClose: () => void;
};

export const RemoveTeammateDialog = ({ teammate, onClose }: RemoveTeammateDialogProps) => {
  const { mutate } = useRemoveTeammate();
  const changeOpen = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );
  const confirm = useCallback(
    () => mutate({ userId: teammate.id, name: teammate.name }),
    [mutate, teammate],
  );
  return (
    <AlertDialog open onOpenChange={changeOpen}>
      <AlertDialogContent
        overlayClassName={DIALOG_OVERLAY_CLASS}
        className={cn(
          DIALOG_SHADOW_CLASS,
          "gap-[18px] rounded-[14px] p-5 data-[size=default]:sm:max-w-[460px] lg:rounded-xl lg:p-6",
        )}
      >
        <AlertDialogHeader className="gap-1.5">
          <AlertDialogTitle className={DIALOG_TITLE_CLASS}>
            {text.title(teammate.name)}
          </AlertDialogTitle>
          <AlertDialogDescription className={DIALOG_TEXT_CLASS}>
            {text.text(teammate.name)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>{teamFr.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={confirm}>
            {text.submit}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
