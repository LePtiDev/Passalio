import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import type { PlanningView } from "../../planning-search";

const text = schedulingFr.planning;

const OPTIONS: readonly { readonly view: PlanningView; readonly label: string }[] = [
  { view: "jour", label: text.day },
  { view: "semaine", label: text.week },
];

const ViewOption = ({
  view,
  label,
  isActive,
  isLarge,
  onChange,
}: {
  readonly view: PlanningView;
  readonly label: string;
  readonly isActive: boolean;
  readonly isLarge: boolean;
  readonly onChange: (view: PlanningView) => void;
}) => {
  const choose = useCallback(() => onChange(view), [onChange, view]);
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-center px-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0F2A44]",
        isLarge ? "rounded-[9px] text-sm" : "h-7 rounded-md text-[13px]",
        isActive
          ? "bg-white font-semibold shadow-[0_1px_2px_rgba(15,42,68,0.1)]"
          : "font-medium text-[#64748B]",
      )}
    >
      <input
        type="radio"
        name={isLarge ? "planning-view-mobile" : "planning-view"}
        value={view}
        checked={isActive}
        onChange={choose}
        className="sr-only"
      />
      {label}
    </label>
  );
};

export const ViewSwitch = ({
  view,
  onChange,
  isLarge,
}: {
  readonly view: PlanningView;
  readonly onChange: (view: PlanningView) => void;
  readonly isLarge: boolean;
}) => (
  <fieldset
    className={cn(
      "grid grid-cols-2 gap-0.5 bg-[#EEF2F6]",
      isLarge ? "h-12 rounded-xl p-1" : "rounded-lg p-0.5",
    )}
  >
    <legend className="sr-only">{text.views}</legend>
    {OPTIONS.map((option) => (
      <ViewOption
        key={option.view}
        view={option.view}
        label={option.label}
        isActive={option.view === view}
        isLarge={isLarge}
        onChange={onChange}
      />
    ))}
  </fieldset>
);
