import type { Energy, EquipmentKind } from "@passalio/shared";
import { EQUIPMENT_CATALOG } from "@passalio/trades";
import { useCallback, useMemo } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ENERGY_LABELS, EQUIPMENT_KIND_LABELS, customersFr } from "../../fr";
import { DEFAULT_ENERGY } from "../../plate-reading";
import { SELECT_TRIGGER_CLASS } from "../customer-styles";
import { describedBy, FormField } from "../form/form-field";
import { isHeatPumpKind, type EquipmentFormValues } from "./equipment-form-schema";
import { plateFieldClassOf, PlateTag, usePlateMark } from "./plate-marks";

const text = customersFr.equipmentForm;

const FUELS: readonly Energy[] = ["wood_logs", "pellets", "gas", "oil", "coal"];

const MENU_CLASS =
  "rounded-[10px] border-[#E3E8EF] py-1 shadow-[0_8px_24px_rgba(15,42,68,0.10)] lg:rounded-lg [&_[data-radix-select-viewport]]:p-0";

const MENU_LABEL_CLASS =
  "px-3.5 pt-2.5 pb-1 text-xs font-semibold tracking-[0.04em] text-[#64748B] uppercase lg:px-3";

const MENU_ITEM_CLASS =
  "min-h-12 rounded-none px-3.5 text-[15px] focus:bg-[#F7F9FB] data-[state=checked]:bg-[#F3FAF7] data-[state=checked]:font-semibold data-[state=checked]:text-[#0E7C5A] lg:min-h-9 lg:px-3 lg:text-[13px] [&_svg:not([class*='text-'])]:text-[#0E7C5A] [&>[data-slot=select-item-indicator]]:right-3.5 lg:[&>[data-slot=select-item-indicator]]:right-3";

type KindGroup = { readonly title: string; readonly kinds: readonly EquipmentKind[] };

const kindGroupsOf = (kinds: readonly EquipmentKind[]): readonly KindGroup[] =>
  [
    {
      title: text.kindGroups.flue,
      kinds: kinds.filter((kind) => EQUIPMENT_CATALOG[kind].family !== "heat_pump"),
    },
    {
      title: text.kindGroups.heatPump,
      kinds: kinds.filter((kind) => EQUIPMENT_CATALOG[kind].family === "heat_pump"),
    },
  ].filter((group) => group.kinds.length > 0);

const KIND_ID = "equipment-kind";
const ENERGY_ID = "equipment-energy";

export const EquipmentKindField = ({ kinds }: { readonly kinds: readonly EquipmentKind[] }) => {
  const { setValue } = useFormContext<EquipmentFormValues>();
  const { field, fieldState } = useController<EquipmentFormValues, "kind">({ name: "kind" });
  const mark = usePlateMark("kind");
  const tag = useMemo(() => <PlateTag mark={mark} />, [mark]);
  const { onChange } = field;
  const choose = useCallback(
    (value: string) => {
      const kind = kinds.find((candidate) => candidate === value);
      if (kind === undefined) {
        return;
      }
      onChange(kind);
      setValue("energy", DEFAULT_ENERGY[kind] ?? null);
    },
    [kinds, onChange, setValue],
  );
  const groups = useMemo(() => kindGroupsOf(kinds), [kinds]);
  const error = fieldState.error?.message;
  return (
    <FormField id={KIND_ID} label={text.kind} error={error} hint={text.kindHint} labelAside={tag}>
      <Select value={field.value ?? ""} onValueChange={choose}>
        <SelectTrigger
          id={KIND_ID}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy(KIND_ID, error, text.kindHint)}
          className={cn(SELECT_TRIGGER_CLASS, plateFieldClassOf(mark))}
        >
          <SelectValue placeholder={text.kindPlaceholder} />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={6} className={MENU_CLASS}>
          {groups.map((group) => (
            <SelectGroup key={group.title}>
              <SelectLabel className={MENU_LABEL_CLASS}>{group.title}</SelectLabel>
              {group.kinds.map((kind) => (
                <SelectItem key={kind} value={kind} className={MENU_ITEM_CLASS}>
                  {EQUIPMENT_KIND_LABELS[kind]}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};

export const EnergyField = () => {
  const kind = useWatch<EquipmentFormValues, "kind">({ name: "kind" });
  const { field } = useController<EquipmentFormValues, "energy">({ name: "energy" });
  const mark = usePlateMark("energy");
  const tag = useMemo(() => <PlateTag mark={mark} />, [mark]);
  const { onChange } = field;
  const choose = useCallback(
    (value: string) => onChange(FUELS.find((fuel) => fuel === value) ?? null),
    [onChange],
  );
  if (isHeatPumpKind(kind)) {
    return null;
  }
  return (
    <FormField id={ENERGY_ID} label={text.energy} labelAside={tag}>
      <Select value={field.value ?? ""} onValueChange={choose}>
        <SelectTrigger id={ENERGY_ID} className={cn(SELECT_TRIGGER_CLASS, plateFieldClassOf(mark))}>
          <SelectValue placeholder={text.energyPlaceholder} />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={6} className={MENU_CLASS}>
          {FUELS.map((fuel) => (
            <SelectItem key={fuel} value={fuel} className={MENU_ITEM_CLASS}>
              {ENERGY_LABELS[fuel]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
};
