import { Search } from "lucide-react";
import { useCallback, type ChangeEvent } from "react";
import { salesFr } from "../../fr";

type MapSearchProps = {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
};

export const MapSearch = ({ value, placeholder, onChange }: MapSearchProps) => {
  const change = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    [onChange],
  );
  return (
    <label className="absolute inset-x-3 top-3 z-10 flex h-12 items-center gap-2 rounded-xl border border-[#E3E8EF] bg-white px-3 shadow-[0_2px_8px_rgba(15,42,68,0.08)] lg:hidden">
      <Search aria-hidden="true" className="size-[18px] shrink-0 text-[#94A3B8]" />
      <input
        type="search"
        value={value}
        aria-label={salesFr.prospection.searchLabel}
        placeholder={placeholder}
        onChange={change}
        className="min-w-0 flex-1 bg-transparent text-base text-[#0F2A44] outline-none placeholder:text-[#94A3B8]"
      />
    </label>
  );
};
