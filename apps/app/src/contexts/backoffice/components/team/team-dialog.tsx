import { ChevronLeft } from "lucide-react";
import type { FormEventHandler, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { teamFr } from "../../team-fr";
import {
  DIALOG_CONTENT_CLASS,
  DIALOG_OVERLAY_CLASS,
  DIALOG_SHADOW_CLASS,
  DIALOG_TEXT_CLASS,
  DIALOG_TITLE_CLASS,
} from "./team-styles";

type TeamDialogProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly mobileTitle: string;
  readonly description: string;
  readonly submitLabel: string;
  readonly isSubmitting: boolean;
  readonly children: ReactNode;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly onCancel: () => void;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
};

const MobileHeader = ({ title }: { readonly title: string }) => (
  <div className="flex min-h-16 shrink-0 items-center gap-1 border-b border-[#E3E8EF] bg-white px-4 py-2 lg:hidden">
    <DialogClose asChild>
      <button
        type="button"
        aria-label={teamFr.back}
        className="-ml-3 flex size-12 items-center justify-center text-[#0F2A44]"
      >
        <ChevronLeft aria-hidden="true" className="size-[22px]" strokeWidth={2} />
      </button>
    </DialogClose>
    <span aria-hidden="true" className="flex min-w-0 flex-col">
      <span className="truncate text-[17px] font-bold">{title}</span>
      <span className="text-[13px] text-[#64748B]">{teamFr.title}</span>
    </span>
  </div>
);

export const TeamDialog = ({
  isOpen,
  title,
  mobileTitle,
  description,
  submitLabel,
  isSubmitting,
  children,
  onOpenChange,
  onCancel,
  onSubmit,
}: TeamDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent
      showCloseButton={false}
      overlayClassName={cn(DIALOG_OVERLAY_CLASS, "max-lg:bg-transparent")}
      className={cn(DIALOG_SHADOW_CLASS, DIALOG_CONTENT_CLASS)}
    >
      <form
        noValidate
        onSubmit={onSubmit}
        className="flex min-h-0 flex-col max-lg:h-full lg:gap-[18px]"
      >
        <MobileHeader title={mobileTitle} />
        <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-4 lg:contents">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className={cn(DIALOG_TITLE_CLASS, "max-lg:sr-only")}>{title}</DialogTitle>
            <DialogDescription className={DIALOG_TEXT_CLASS}>{description}</DialogDescription>
          </div>
          {children}
          <div className="flex flex-col gap-2 lg:flex-row lg:justify-end">
            <Button type="button" variant="secondary" className="max-lg:hidden" onClick={onCancel}>
              {teamFr.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
