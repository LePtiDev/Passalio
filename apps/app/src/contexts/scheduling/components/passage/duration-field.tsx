import { Timer } from "lucide-react";
import { useCallback } from "react";
import { FormField, HINT_TEXT_CLASS, SELECT_TRIGGER_CLASS } from "@/contexts/customers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VisitTypeRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { formatDuration, schedulingFr } from "../../fr";
import { DURATION_CHOICES, usualMinutesOf } from "../../visit-types";

const text = schedulingFr.form;

const FIELD_ID = "visit-duration";

const HINT_ID = `${FIELD_ID}-hint`;

const DurationHint = ({
  minutes,
  chosen,
  onReset,
}: {
  readonly minutes: number;
  readonly chosen: readonly VisitTypeRecord[];
  readonly onReset: () => void;
}) => {
  const usual = usualMinutesOf(chosen);
  if (chosen.length === 0 || usual === minutes) {
    return (
      <p id={HINT_ID} className={HINT_TEXT_CLASS}>
        {text.durationHint(chosen)}
      </p>
    );
  }
  return (
    <p id={HINT_ID} className={HINT_TEXT_CLASS}>
      {text.durationChanged(usual)}{" "}
      <button
        type="button"
        onClick={onReset}
        className="font-semibold text-[#0E7C5A] underline-offset-2 hover:underline"
      >
        {text.durationReset(usual)}
      </button>
    </p>
  );
};

export const DurationField = ({
  minutes,
  chosen,
  onChange,
}: {
  readonly minutes: number;
  readonly chosen: readonly VisitTypeRecord[];
  readonly onChange: (minutes: number) => void;
}) => {
  const choose = useCallback((value: string) => onChange(Number(value)), [onChange]);
  const reset = useCallback(() => onChange(usualMinutesOf(chosen)), [onChange, chosen]);
  return (
    <FormField id={FIELD_ID} label={text.duration} isRequired>
      <Select value={String(minutes)} onValueChange={choose}>
        <SelectTrigger
          id={FIELD_ID}
          aria-required="true"
          aria-describedby={HINT_ID}
          className={cn(SELECT_TRIGGER_CLASS, "gap-2")}
        >
          <Timer aria-hidden="true" className="size-4 shrink-0 text-[#64748B]" />
          <span className="flex-1 text-left">
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {DURATION_CHOICES.map((choice) => (
            <SelectItem key={choice} value={String(choice)} className="min-h-12 lg:min-h-8">
              {formatDuration(choice)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DurationHint minutes={minutes} chosen={chosen} onReset={reset} />
    </FormField>
  );
};
