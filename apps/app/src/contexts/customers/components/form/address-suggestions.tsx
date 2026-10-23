import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { customersFr } from "../../fr";
import type { AddressSuggestion } from "../../hooks/use-address-search";

const text = customersFr.form;

const SuggestionButton = ({
  suggestion,
  isFirst,
  onPick,
}: {
  readonly suggestion: AddressSuggestion;
  readonly isFirst: boolean;
  readonly onPick: (suggestion: AddressSuggestion) => void;
}) => {
  const pick = useCallback(() => onPick(suggestion), [onPick, suggestion]);
  return (
    <li className="border-b border-[#EEF2F6] last:border-b-0">
      <button
        type="button"
        onClick={pick}
        className={cn(
          "flex min-h-12 w-full flex-col justify-center px-3.5 py-2 text-left hover:bg-[#F7F9FB] focus-visible:bg-[#F7F9FB] focus-visible:outline-none",
          isFirst && "bg-[#F7F9FB]",
        )}
      >
        <span className="text-[15px] font-semibold lg:text-[13px]">{suggestion.address}</span>
        <span className="text-[13px] text-[#64748B]">
          {suggestion.postalCode} {suggestion.city}
        </span>
      </button>
    </li>
  );
};

export const AddressSuggestions = ({
  suggestions,
  onPick,
  onManualEntry,
}: {
  readonly suggestions: readonly AddressSuggestion[];
  readonly onPick: (suggestion: AddressSuggestion) => void;
  readonly onManualEntry: () => void;
}) => (
  <>
    {suggestions.length === 0 ? null : (
      <ul className="-mt-2.5 overflow-hidden rounded-[10px] border border-[#E3E8EF] bg-white shadow-[0_8px_24px_rgba(15,42,68,0.10)] lg:rounded-lg">
        {suggestions.map((suggestion, index) => (
          <SuggestionButton
            key={suggestion.id}
            suggestion={suggestion}
            isFirst={index === 0}
            onPick={onPick}
          />
        ))}
      </ul>
    )}
    <p className="-mt-2 text-[13px] text-[#64748B]">
      {text.addressSource}{" "}
      <button
        type="button"
        onClick={onManualEntry}
        className="font-semibold text-[#0E7C5A] hover:text-[#0B6349]"
      >
        {text.manualEntry}
      </button>
    </p>
  </>
);
