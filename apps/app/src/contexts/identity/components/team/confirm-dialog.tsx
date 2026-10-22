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
import { identityFr } from "../../fr";

type ConfirmDialogProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly isDestructive?: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly onConfirm: () => void;
};

const BUTTON_CLASS = "h-12 text-base lg:h-10 lg:text-sm";

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  isDestructive = false,
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
        <AlertDialogCancel className={BUTTON_CLASS}>{identityFr.team.cancel}</AlertDialogCancel>
        <AlertDialogAction
          className={cn(BUTTON_CLASS, isDestructive && "bg-destructive hover:bg-destructive/90")}
          onClick={onConfirm}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
