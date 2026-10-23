import type { Energy, EquipmentKind } from "@passalio/shared";
import { EQUIPMENT_CATALOG } from "@passalio/trades";
import { useCallback, useMemo } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";
import { ENERGY_LABELS, EQUIPMENT_KIND_LABELS, customersFr } from "../../fr";
import { ERROR_TEXT_CLASS, HINT_TEXT_CLASS, LABEL_CLASS } from "../customer-styles";
import { ChipGroup, type Choice } from "../form/choice-controls";
import { isHeatPumpKind, type EquipmentFormValues } from "./equipment-form-schema";

const text = customersFr.equipmentForm;

const DEFAULT_ENERGY: Partial<Readonly<Record<EquipmentKind, Energy>>> = {
  open_fireplace: "wood_logs",
  insert: "wood_logs",
  log_stove: "wood_logs",
  pellet_stove: "pellets",
  solid_fuel_cooker: "wood_logs",
};

const FUEL_CHOICES: readonly Choice<Energy>[] = (
  ["wood_logs", "pellets", "gas", "oil", "coal"] as const
).map((energy) => ({ value: energy, label: ENERGY_LABELS[energy] }));

const kindChoices = (kinds: readonly EquipmentKind[]): readonly Choice<EquipmentKind>[] =>
  kinds.map((kind) => ({ value: kind, label: EQUIPMENT_KIND_LABELS[kind] }));

const KindGroup = ({
  title,
  kinds,
  value,
  onChange,
}: {
  readonly title: string;
  readonly kinds: readonly EquipmentKind[];
  readonly value: EquipmentKind | null;
  readonly onChange: (kind: EquipmentKind) => void;
}) =>
  kinds.length === 0 ? null : (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-[0.04em] text-[#64748B] uppercase">
        {title}
      </span>
      <ChipGroup
        label={title}
        choices={kindChoices(kinds)}
        value={value !== null && kinds.includes(value) ? value : null}
        onChange={onChange}
      />
    </div>
  );

export const EquipmentKindField = ({ kinds }: { readonly kinds: readonly EquipmentKind[] }) => {
  const { setValue } = useFormContext<EquipmentFormValues>();
  const { field, fieldState } = useController<EquipmentFormValues, "kind">({ name: "kind" });
  const { onChange } = field;
  const choose = useCallback(
    (kind: EquipmentKind) => {
      onChange(kind);
      setValue("energy", DEFAULT_ENERGY[kind] ?? null);
    },
    [onChange, setValue],
  );
  const flueKinds = useMemo(
    () => kinds.filter((kind) => EQUIPMENT_CATALOG[kind].family !== "heat_pump"),
    [kinds],
  );
  const heatPumpKinds = useMemo(
    () => kinds.filter((kind) => EQUIPMENT_CATALOG[kind].family === "heat_pump"),
    [kinds],
  );
  return (
    <div className="flex flex-col gap-3">
      <span className={LABEL_CLASS}>{text.kind}</span>
      <KindGroup
        title={text.kindGroups.flue}
        kinds={flueKinds}
        value={field.value}
        onChange={choose}
      />
      <KindGroup
        title={text.kindGroups.heatPump}
        kinds={heatPumpKinds}
        value={field.value}
        onChange={choose}
      />
      {fieldState.error?.message === undefined ? null : (
        <p className={ERROR_TEXT_CLASS}>{fieldState.error.message}</p>
      )}
      <p className={HINT_TEXT_CLASS}>{text.kindHint}</p>
    </div>
  );
};

export const EnergyField = () => {
  const kind = useWatch<EquipmentFormValues, "kind">({ name: "kind" });
  const { field } = useController<EquipmentFormValues, "energy">({ name: "energy" });
  if (kind === null || isHeatPumpKind(kind)) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>{text.energy}</span>
      <ChipGroup
        label={text.energy}
        choices={FUEL_CHOICES}
        value={field.value}
        onChange={field.onChange}
      />
    </div>
  );
};
