import { useCallback, type FormEventHandler, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from "@/contexts/backoffice";

type FormDialogProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly submitLabel: string;
  readonly cancelLabel: string;
  readonly isSubmitting: boolean;
  readonly aside?: ReactNode;
  readonly children: ReactNode;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
};

export const FormDialog = ({
  isOpen,
  title,
  description,
  submitLabel,
  cancelLabel,
  isSubmitting,
  aside,
  children,
  onOpenChange,
  onSubmit,
}: FormDialogProps) => {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92dvh] gap-0 overflow-y-auto rounded-[14px] p-0 sm:max-w-xl lg:rounded-xl"
      >
        <form noValidate onSubmit={onSubmit} className="flex flex-col">
          <DialogHeader className="gap-1 border-b border-[#EEF2F6] px-5 py-4 text-left">
            <DialogTitle className="text-[17px] font-bold lg:text-base">{title}</DialogTitle>
            <DialogDescription className="text-[13px] text-[#475569]">
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-5 py-4 lg:grid-cols-2">{children}</div>
          <DialogFooter className="gap-2 border-t border-[#EEF2F6] px-5 py-3 sm:justify-between">
            <span className="flex">{aside}</span>
            <span className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className={ADMIN_SECONDARY_BUTTON_CLASS}
                onClick={close}
              >
                {cancelLabel}
              </Button>
              <Button type="submit" className={ADMIN_PRIMARY_BUTTON_CLASS} disabled={isSubmitting}>
                {submitLabel}
              </Button>
            </span>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
