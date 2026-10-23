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
import { customersFr } from "../fr";

type ConfirmDialogProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly onConfirm: () => void;
};

const BUTTON_CLASS = "h-12 text-base lg:h-10 lg:text-sm";

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) => (
  <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className={BUTTON_CLASS}>
          {customersFr.file.confirmCancel}
        </AlertDialogCancel>
        <AlertDialogAction
          className={`${BUTTON_CLASS} bg-destructive hover:bg-destructive/90`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
