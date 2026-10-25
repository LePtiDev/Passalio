import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CompanyLegalForm } from "@/contexts/identity";
import { useCan } from "@/lib/permissions/use-can";
import { complianceFr } from "../../fr";

const text = complianceFr.legal;

type LegalSheetProps = {
  readonly isOpen: boolean;
  readonly isWaiting: boolean;
  readonly onClose: () => void;
  readonly onSaved: () => void;
};

const TechnicianNotice = ({ onClose }: { readonly onClose: () => void }) => (
  <div className="flex flex-col gap-4 px-4 py-4 pb-[max(16px,env(safe-area-inset-bottom))] lg:px-6">
    <Button type="button" onClick={onClose} className="w-full lg:w-auto lg:self-end">
      {text.understood}
    </Button>
  </div>
);

export const LegalSheet = ({ isOpen, isWaiting, onClose, onSaved }: LegalSheetProps) => {
  const canEdit = useCan("organization:update");
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92dvh] max-w-[720px] gap-0 rounded-t-[18px] bg-white"
      >
        <div className="flex flex-col gap-1 border-b border-[#E3E8EF] px-4 pt-5 pb-4 lg:px-6">
          <SheetTitle className="text-[19px] font-bold lg:text-[17px]">
            {canEdit ? text.title : text.technicianTitle}
          </SheetTitle>
          <SheetDescription className="text-[15px] text-[#475569] lg:text-[13px]">
            {canEdit ? text.text : text.technicianText}
          </SheetDescription>
        </div>
        {isWaiting ? (
          <p
            aria-live="polite"
            className="px-4 py-6 text-[15px] text-[#475569] lg:px-6 lg:text-[13px]"
          >
            {text.waiting}
          </p>
        ) : canEdit ? (
          <CompanyLegalForm
            submitLabel={text.submit}
            laterLabel={text.later}
            onLater={onClose}
            onSaved={onSaved}
          />
        ) : (
          <TechnicianNotice onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  );
};
