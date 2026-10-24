import { Minus, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { VisitTypeRecord } from "@/lib/db/local-records";
import { formatDuration, schedulingFr, VISIT_TYPE_LABELS } from "../../fr";
import { steppedDuration } from "../../visit-types";

const text = schedulingFr.visitTypes;

const STEP_BUTTON_CLASS =
  "flex size-12 items-center justify-center rounded-[10px] bg-[#EEF3F8] text-[#0F2A44] disabled:opacity-40";

const DurationStepper = ({
  visitType,
  isSaving,
  onSave,
}: {
  readonly visitType: VisitTypeRecord;
  readonly isSaving: boolean;
  readonly onSave: (minutes: number) => void;
}) => {
  const [minutes, setMinutes] = useState(visitType.minutes);
  const decrease = useCallback(() => setMinutes((current) => steppedDuration(current, -1)), []);
  const increase = useCallback(() => setMinutes((current) => steppedDuration(current, 1)), []);
  const save = useCallback(() => onSave(minutes), [onSave, minutes]);
  return (
    <>
      <div className="flex items-center gap-2 rounded-[14px] border border-[#E3E8EF] p-1.5">
        <button
          type="button"
          onClick={decrease}
          disabled={minutes === steppedDuration(minutes, -1)}
          aria-label={text.decrease}
          className={STEP_BUTTON_CLASS}
        >
          <Minus aria-hidden="true" className="size-5" />
        </button>
        <output aria-live="polite" className="flex-1 text-center text-2xl font-bold tabular-nums">
          {formatDuration(minutes)}
        </output>
        <button
          type="button"
          onClick={increase}
          disabled={minutes === steppedDuration(minutes, 1)}
          aria-label={text.increase}
          className={STEP_BUTTON_CLASS}
        >
          <Plus aria-hidden="true" className="size-5" />
        </button>
      </div>
      <p className="text-center text-[13px] text-[#64748B]">{text.stepHint}</p>
      <Button type="button" onClick={save} disabled={isSaving} className="w-full">
        {text.save}
      </Button>
    </>
  );
};

export const DurationSheet = ({
  visitType,
  isSaving,
  onClose,
  onSave,
}: {
  readonly visitType: VisitTypeRecord | null;
  readonly isSaving: boolean;
  readonly onClose: () => void;
  readonly onSave: (minutes: number) => void;
}) => {
  const changeOpen = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        onClose();
      }
    },
    [onClose],
  );
  return (
    <Sheet open={visitType !== null} onOpenChange={changeOpen}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-3 rounded-t-[20px] border-0 px-4 pt-2 pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        <span aria-hidden="true" className="mx-auto mb-1 h-1 w-10 rounded-full bg-[#CBD5E1]" />
        {visitType === null ? null : (
          <>
            <div className="flex flex-col gap-1">
              <SheetTitle className="text-[17px] font-bold">
                {VISIT_TYPE_LABELS[visitType.type].label}
              </SheetTitle>
              <SheetDescription className="text-sm text-[#64748B]">
                {text.sheetText}
              </SheetDescription>
            </div>
            <DurationStepper
              key={visitType.type}
              visitType={visitType}
              isSaving={isSaving}
              onSave={onSave}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
