import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { identityFr } from "../fr";

type ConfirmActionProps = {
  readonly triggerLabel: string;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly isDestructive?: boolean;
  readonly isPending: boolean;
  readonly onConfirm: () => void;
};

export const ConfirmAction = ({
  triggerLabel,
  title,
  description,
  confirmLabel,
  isDestructive = false,
  isPending,
  onConfirm,
}: ConfirmActionProps) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button
        variant={isDestructive ? "ghost" : "outline"}
        className={isDestructive ? "h-12 text-base text-destructive" : "h-12 text-base"}
        disabled={isPending}
      >
        {triggerLabel}
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="h-12 text-base">{identityFr.team.cancel}</AlertDialogCancel>
        <AlertDialogAction
          className={isDestructive ? "h-12 bg-destructive text-base" : "h-12 text-base"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
