import { Check, Search } from "lucide-react";
import { useCallback, useState, type ChangeEvent } from "react";
import type { ServiceRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { formatDuration, formatServicePrice, schedulingFr } from "../../fr";
import { matchingServices, toggledServiceId } from "../../services";

const text = schedulingFr.form;

const ServiceOption = ({
  service,
  isChecked,
  isLarge,
  onToggle,
}: {
  readonly service: ServiceRecord;
  readonly isChecked: boolean;
  readonly isLarge: boolean;
  readonly onToggle: (serviceId: string) => void;
}) => {
  const toggle = useCallback(() => onToggle(service.id), [onToggle, service.id]);
  return (
    <li>
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3",
          isLarge
            ? "min-h-12 px-1 text-[15px]"
            : "min-h-8 rounded-md px-2 text-[13px] hover:bg-[#F7F9FB]",
        )}
      >
        <input type="checkbox" className="peer sr-only" checked={isChecked} onChange={toggle} />
        <span
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-[5px] border peer-focus-visible:ring-2 peer-focus-visible:ring-[#0F2A44]",
            isLarge ? "size-5" : "size-4",
            isChecked ? "border-[#0E7C5A] bg-[#0E7C5A] text-white" : "border-[#CBD5E1] bg-white",
          )}
        >
          {isChecked ? <Check className={isLarge ? "size-3.5" : "size-3"} strokeWidth={3} /> : null}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">{service.name}</span>
        <span className="shrink-0 text-[13px] text-[#94A3B8] tabular-nums lg:text-xs">
          {formatDuration(service.durationMinutes)} · {formatServicePrice(service.priceCents)}
        </span>
      </label>
    </li>
  );
};

export const ServiceList = ({
  offered,
  value,
  isLarge,
  onChange,
}: {
  readonly offered: readonly ServiceRecord[];
  readonly value: readonly string[];
  readonly isLarge: boolean;
  readonly onChange: (serviceIds: readonly string[]) => void;
}) => {
  const [search, setSearch] = useState("");
  const changeSearch = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value),
    [],
  );
  const toggle = useCallback(
    (serviceId: string) => onChange(toggledServiceId(offered, value, serviceId)),
    [onChange, offered, value],
  );
  const shown = matchingServices(offered, search);
  return (
    <>
      <label
        className={cn(
          "flex items-center gap-2 border border-[#E3E8EF] text-[#94A3B8] focus-within:border-[#0E7C5A]",
          isLarge ? "h-12 rounded-[10px] px-3" : "mx-2 h-8 rounded-[7px] px-2.5",
        )}
      >
        <Search aria-hidden="true" className={isLarge ? "size-4" : "size-3.5"} />
        <input
          type="search"
          value={search}
          onChange={changeSearch}
          aria-label={text.servicesSearch}
          placeholder={text.servicesSearch}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[#0F2A44] outline-none placeholder:text-[#94A3B8]",
            isLarge ? "text-[15px]" : "text-[13px]",
          )}
        />
      </label>
      {shown.length === 0 ? (
        <p
          className={cn("text-[#64748B]", isLarge ? "py-3 text-[15px]" : "px-2 py-1.5 text-[13px]")}
        >
          {text.servicesNoMatch}
        </p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((service) => (
            <ServiceOption
              key={service.id}
              service={service}
              isChecked={value.includes(service.id)}
              isLarge={isLarge}
              onToggle={toggle}
            />
          ))}
        </ul>
      )}
    </>
  );
};
