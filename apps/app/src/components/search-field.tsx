import { Search } from "lucide-react";
import { useCallback, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchFieldProps = {
  readonly value: string;
  readonly label: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
  readonly className?: string;
};

export const SearchField = ({
  value,
  label,
  placeholder,
  onChange,
  className,
}: SearchFieldProps) => {
  const change = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    [onChange],
  );
  return (
    <div className={cn("relative flex items-center lg:w-72", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 size-[18px] text-[#94A3B8] lg:left-2.5 lg:size-3.5"
      />
      <Input
        type="search"
        value={value}
        onChange={change}
        aria-label={label}
        placeholder={placeholder}
        className="h-12 rounded-[10px] border-[#D5DDE6] bg-white pr-3.5 pl-10 text-base shadow-[0_1px_2px_rgba(15,42,68,0.05)] placeholder:text-[#94A3B8] lg:h-8 lg:rounded-[7px] lg:pr-2.5 lg:pl-8 lg:text-[13px]"
      />
    </div>
  );
};
