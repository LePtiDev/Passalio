import { adviceCardsOf } from "@passalio/pdf/advice";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { EquipmentRecord } from "@/lib/db/local-records";
import { certificateEquipmentOf } from "../../certificate-body";
import { complianceFr } from "../../fr";

const text = complianceFr.sign;

export const AdviceSheet = ({
  equipment,
  onClose,
}: {
  readonly equipment: EquipmentRecord | null;
  readonly onClose: () => void;
}) => (
  <Sheet open={equipment !== null} onOpenChange={onClose}>
    <SheetContent
      side="bottom"
      showCloseButton={false}
      aria-describedby={undefined}
      className="mx-auto h-[90dvh] max-w-[720px] gap-0 rounded-t-[18px] bg-white"
    >
      <div className="flex min-h-14 items-center gap-2 border-b border-[#E3E8EF] px-2">
        <SheetClose asChild>
          <button
            type="button"
            className="flex size-12 items-center justify-center rounded-[10px] text-[#0F2A44] hover:bg-[#F7F9FB]"
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">{text.close}</span>
          </button>
        </SheetClose>
        <SheetTitle className="text-[17px] font-bold">{text.adviceTitle}</SheetTitle>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:px-6">
        {equipment === null
          ? null
          : adviceCardsOf(certificateEquipmentOf(equipment)).map((card) => (
              <section key={card.title} className="flex flex-col gap-1">
                <h3 className="text-[15px] font-semibold lg:text-sm">{card.title}</h3>
                <p className="text-[15px] leading-relaxed text-[#475569] lg:text-[13px]">
                  {card.body}
                </p>
              </section>
            ))}
      </div>
      <div className="border-t border-[#E3E8EF] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <SheetClose asChild>
          <Button type="button" variant="secondary" className="w-full">
            {text.close}
          </Button>
        </SheetClose>
      </div>
    </SheetContent>
  </Sheet>
);
