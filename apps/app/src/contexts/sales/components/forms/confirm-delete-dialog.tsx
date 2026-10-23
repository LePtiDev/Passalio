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
import { ADMIN_SECONDARY_BUTTON_CLASS } from "@/contexts/backoffice";

type ConfirmDeleteDialogProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly onConfirm: () => void;
};

export const ConfirmDeleteDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteDialogProps) => (
  <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className={ADMIN_SECONDARY_BUTTON_CLASS}>
          {cancelLabel}
        </AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          className="h-12 rounded-[10px] text-[15px] font-semibold lg:h-8 lg:rounded-[7px] lg:px-3 lg:text-[13px]"
          onClick={onConfirm}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
