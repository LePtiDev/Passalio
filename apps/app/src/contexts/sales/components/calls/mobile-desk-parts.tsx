import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { callsFr } from "../../fr-calls";
import { CALL_FORM_ID } from "./call-result-form";

const text = callsFr.session;

export const QualificationToggle = ({
  isOpen,
  onToggle,
}: {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}) => (
  <button
    type="button"
    aria-expanded={isOpen}
    className="flex min-h-12 items-center gap-1.5 self-start text-[15px] font-semibold text-[#0E7C5A]"
    onClick={onToggle}
  >
    {isOpen ? text.hideQualification : text.showQualification}
    <ChevronDown
      aria-hidden="true"
      className={cn("size-4 transition-transform", isOpen && "rotate-180")}
    />
  </button>
);

export const MobileDeskFooter = ({
  hasNext,
  isSaving,
  onSkip,
}: {
  readonly hasNext: boolean;
  readonly isSaving: boolean;
  readonly onSkip: () => void;
}) => (
  <div
    data-sticky-footer
    className="sticky bottom-0 -mx-4 mt-auto flex gap-2.5 border-t border-[#E3E8EF] bg-white px-4 pt-3 pb-5"
  >
    <Button
      type="button"
      variant="outline"
      className={ADMIN_SECONDARY_BUTTON_CLASS}
      disabled={isSaving}
      onClick={onSkip}
    >
      {text.skip}
    </Button>
    <Button
      type="submit"
      form={CALL_FORM_ID}
      disabled={isSaving}
      className={cn(ADMIN_PRIMARY_BUTTON_CLASS, "flex-1")}
    >
      {hasNext ? text.saveAndNext : text.save}
    </Button>
  </div>
);
