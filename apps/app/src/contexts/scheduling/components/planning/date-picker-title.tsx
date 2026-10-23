import { ChevronDown } from "lucide-react";
import { useCallback, useRef, type ChangeEvent } from "react";
import { schedulingFr } from "../../fr";

export const DatePickerTitle = ({
  title,
  day,
  onSelect,
}: {
  readonly title: string;
  readonly day: string;
  readonly onSelect: (day: string) => void;
}) => {
  const input = useRef<HTMLInputElement>(null);
  const openPicker = useCallback(() => input.current?.showPicker(), []);
  const select = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value !== "") {
        onSelect(event.target.value);
      }
    },
    [onSelect],
  );
  return (
    <span className="relative flex min-w-0 flex-1 items-center">
      <button
        type="button"
        onClick={openPicker}
        aria-label={`${title}, ${schedulingFr.planning.chooseMonth}`}
        className="flex min-h-12 min-w-0 items-center gap-1 text-[17px] font-bold"
      >
        <span className="truncate">{title}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[#64748B]" />
      </button>
      <input
        ref={input}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={day}
        onChange={select}
        className="pointer-events-none absolute bottom-0 left-0 size-px opacity-0"
      />
    </span>
  );
};
