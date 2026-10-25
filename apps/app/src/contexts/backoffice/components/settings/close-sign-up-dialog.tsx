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
import { settingsFr } from "../../settings-fr";
import {
  DIALOG_OVERLAY_CLASS,
  DIALOG_SHADOW_CLASS,
  DIALOG_TEXT_CLASS,
  DIALOG_TITLE_CLASS,
} from "../team/team-styles";

const text = settingsFr.closeDialog;

type CloseSignUpDialogProps = {
  readonly environment: string;
  readonly host: string;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
};

export const CloseSignUpDialog = ({
  environment,
  host,
  onConfirm,
  onClose,
}: CloseSignUpDialogProps) => {
  const changeOpen = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
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
            {text.title(environment)}
          </AlertDialogTitle>
          <AlertDialogDescription className={DIALOG_TEXT_CLASS}>
            {text.text(host)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onConfirm}>
            {text.submit}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
