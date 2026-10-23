import type { FormEventHandler, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { teamFr } from "../../team-fr";
import {
  DIALOG_BUTTON_CLASS,
  DIALOG_CONTENT_CLASS,
  DIALOG_TEXT_CLASS,
  DIALOG_TITLE_CLASS,
} from "./team-styles";

type TeamDialogProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly submitLabel: string;
  readonly isSubmitting: boolean;
  readonly children: ReactNode;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly onCancel: () => void;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
};

export const TeamDialog = ({
  isOpen,
  title,
  description,
  submitLabel,
  isSubmitting,
  children,
  onOpenChange,
  onCancel,
  onSubmit,
}: TeamDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className={DIALOG_CONTENT_CLASS}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <DialogHeader className="gap-1.5 pr-8">
          <DialogTitle className={DIALOG_TITLE_CLASS}>{title}</DialogTitle>
          <DialogDescription className={DIALOG_TEXT_CLASS}>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            className={cn(DIALOG_BUTTON_CLASS, "border-[#E3E8EF] font-medium")}
            onClick={onCancel}
          >
            {teamFr.cancel}
          </Button>
          <Button type="submit" className={DIALOG_BUTTON_CLASS} disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);
