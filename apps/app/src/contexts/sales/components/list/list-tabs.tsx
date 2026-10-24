import { useCallback } from "react";
import { cn } from "@/lib/utils";

type TabProps<Id extends string> = {
  readonly id: Id;
  readonly label: string;
  readonly count: number | null;
  readonly isActive: boolean;
  readonly onSelect: (id: Id) => void;
};

const DesktopTab = <Id extends string>({ id, label, count, isActive, onSelect }: TabProps<Id>) => {
  const select = useCallback(() => onSelect(id), [id, onSelect]);
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={select}
      className={cn(
        "-mb-px flex items-center gap-1.5 border-b-2 py-2.5 text-[13px] whitespace-nowrap",
        isActive
          ? "border-[#0F2A44] font-semibold text-[#0F2A44]"
          : "border-transparent font-medium text-[#64748B] hover:text-[#0F2A44]",
      )}
    >
      {label}
      {count === null ? null : (
        <span className="rounded-full bg-[#EEF3F8] px-[7px] py-px text-xs font-semibold text-[#0F2A44]">
          {count}
        </span>
      )}
    </button>
  );
};

const MobileTab = <Id extends string>({ id, label, isActive, onSelect }: TabProps<Id>) => {
  const select = useCallback(() => onSelect(id), [id, onSelect]);
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={select}
      className={cn(
        "h-12 min-w-0 truncate rounded-[9px] px-1 text-sm",
        isActive
          ? "bg-white font-semibold text-[#0F2A44] shadow-[0_1px_2px_rgba(15,42,68,0.1)]"
          : "font-medium text-[#475569]",
      )}
    >
      {label}
    </button>
  );
};

type ListTabsProps<Id extends string> = {
  readonly label: string;
  readonly ids: readonly Id[];
  readonly mobileIds: readonly Id[];
  readonly labels: Readonly<Record<Id, string>>;
  readonly counts: Readonly<Record<Id, number>> | null;
  readonly active: Id;
  readonly onSelect: (id: Id) => void;
};

export const ListTabs = <Id extends string>({
  label,
  ids,
  mobileIds,
  labels,
  counts,
  active,
  onSelect,
}: ListTabsProps<Id>) => (
  <>
    <div className="hidden border-b border-[#E3E8EF] lg:flex">
      <div role="tablist" aria-label={label} className="flex min-w-0 flex-wrap gap-x-6">
        {ids.map((id) => (
          <DesktopTab
            key={id}
            id={id}
            label={labels[id]}
            count={counts === null ? null : counts[id]}
            isActive={active === id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
    <div
      role="tablist"
      aria-label={label}
      className="grid grid-cols-3 gap-1 rounded-xl bg-[#EAEFF4] p-1 lg:hidden"
    >
      {mobileIds.map((id) => (
        <MobileTab
          key={id}
          id={id}
          label={labels[id]}
          count={null}
          isActive={active === id}
          onSelect={onSelect}
        />
      ))}
    </div>
  </>
);
