import { Check } from "lucide-react";
import { useCallback } from "react";
import { dueStatusOf, equipmentNameOf, formatCalendarDate } from "@/contexts/customers";
import type { EquipmentRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import { useNow } from "../../hooks/use-now";

const text = schedulingFr.form;

const sweepingLine = (equipment: EquipmentRecord, today: Date) => {
  if (equipment.lastSweepingOn === null) {
    return text.neverSwept;
  }
  const date = formatCalendarDate(equipment.lastSweepingOn);
  return equipment.nextDueDate !== null && dueStatusOf(equipment.nextDueDate, today) === "overdue"
    ? text.lastSweepingOverdue(date)
    : text.lastSweeping(date);
};

const EquipmentOption = ({
  equipment,
  isChecked,
  today,
  onToggle,
}: {
  readonly equipment: EquipmentRecord;
  readonly isChecked: boolean;
  readonly today: Date;
  readonly onToggle: (equipmentId: string) => void;
}) => {
  const toggle = useCallback(() => onToggle(equipment.id), [onToggle, equipment.id]);
  return (
    <li>
      <label className="flex min-h-12 cursor-pointer items-start gap-3 py-1 text-[15px] lg:min-h-0 lg:text-[13px]">
        <input type="checkbox" className="peer sr-only" checked={isChecked} onChange={toggle} />
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[5px] border peer-focus-visible:ring-2 peer-focus-visible:ring-[#0F2A44] lg:size-4",
            isChecked ? "border-[#0E7C5A] bg-[#0E7C5A] text-white" : "border-[#CBD5E1] bg-white",
          )}
        >
          {isChecked ? <Check className="size-3.5 lg:size-3" strokeWidth={3} /> : null}
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">{equipmentNameOf(equipment)}</span>
          <span className="text-[13px] text-[#64748B]">{sweepingLine(equipment, today)}</span>
        </span>
      </label>
    </li>
  );
};

export const EquipmentChecklist = ({
  equipments,
  selected,
  onChange,
}: {
  readonly equipments: readonly EquipmentRecord[];
  readonly selected: readonly string[];
  readonly onChange: (selected: string[]) => void;
}) => {
  const today = useNow();
  const toggle = useCallback(
    (equipmentId: string) =>
      onChange(
        selected.includes(equipmentId)
          ? selected.filter((id) => id !== equipmentId)
          : [...selected, equipmentId],
      ),
    [onChange, selected],
  );
  if (equipments.length === 0) {
    return <p className="text-[15px] text-[#64748B] lg:text-[13px]">{text.noEquipment}</p>;
  }
  return (
    <ul className="flex flex-col">
      {equipments.map((equipment) => (
        <EquipmentOption
          key={equipment.id}
          equipment={equipment}
          isChecked={selected.includes(equipment.id)}
          today={today}
          onToggle={toggle}
        />
      ))}
    </ul>
  );
};
