import { useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { schedulingFr } from "../../fr";
import { ServiceForm, type ServiceFormProps } from "./service-form";

const text = schedulingFr.services;

export const ServiceEditor = ({
  isOpen,
  formKey,
  onClose,
  ...formProps
}: ServiceFormProps & {
  readonly isOpen: boolean;
  readonly formKey: string;
  readonly onClose: () => void;
}) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const changeOpen = useCallback(
    (next: boolean) => {
      if (!next) {
        onClose();
      }
    },
    [onClose],
  );
  const title = formProps.isExisting ? text.editTitle : text.createTitle;
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={changeOpen}>
        <DialogContent aria-describedby={undefined} className="gap-4 sm:max-w-[520px]">
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <ServiceForm key={formKey} {...formProps} />
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={isOpen} onOpenChange={changeOpen}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-h-[92vh] gap-3 overflow-y-auto rounded-t-[20px] border-0 px-4 pt-2 pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        <span aria-hidden="true" className="mx-auto mb-1 h-1 w-10 rounded-full bg-[#CBD5E1]" />
        <SheetTitle className="text-[17px] font-bold">{title}</SheetTitle>
        <ServiceForm key={formKey} {...formProps} />
      </SheetContent>
    </Sheet>
  );
};
