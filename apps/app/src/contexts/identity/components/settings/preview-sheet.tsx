import { Eye, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { settingsFr } from "../../settings-fr";

const text = settingsFr.documents;

export const PreviewSheet = ({ children }: { readonly children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="secondary" className="flex-1">
          <Eye aria-hidden="true" className="size-4" />
          {text.previewButton}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        aria-describedby={undefined}
        className="h-[100dvh] gap-0 bg-[#F7F9FB]"
      >
        <div className="flex min-h-14 items-center gap-2 border-b border-[#E3E8EF] bg-white px-2">
          <SheetClose asChild>
            <button
              type="button"
              className="flex size-12 items-center justify-center rounded-[10px] text-[#0F2A44] hover:bg-[#F7F9FB]"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{text.previewClose}</span>
            </button>
          </SheetClose>
          <SheetTitle className="text-[17px] font-bold">{text.previewButton}</SheetTitle>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        <div className="border-t border-[#E3E8EF] bg-white p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <SheetClose asChild>
            <Button type="button" variant="secondary" className="w-full">
              {text.previewBack}
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};
