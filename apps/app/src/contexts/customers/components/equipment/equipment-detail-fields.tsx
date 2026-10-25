import { FLUE_TYPES } from "@passalio/trades";
import { useController, useWatch } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { customersFr, FLUE_TYPE_LABELS } from "../../fr";
import { SELECT_TRIGGER_CLASS } from "../customer-styles";
import { FormField } from "@/components/form-field";
import { FieldRow, Fieldset } from "../form/form-shell";
import { isHeatPumpKind, type EquipmentFormValues } from "./equipment-form-schema";
import { EquipmentTextField } from "./equipment-text-field";

const text = customersFr.equipmentForm;

export const IdentityFields = () => {
  const kind = useWatch<EquipmentFormValues, "kind">({ name: "kind" });
  return (
    <>
      <FieldRow>
        <EquipmentTextField
          name="brand"
          label={text.brand}
          isOptional
          placeholder={text.brandPlaceholder}
        />
        <EquipmentTextField name="model" label={text.model} isOptional />
      </FieldRow>
      <FieldRow>
        <EquipmentTextField
          name="serialNumber"
          label={text.serialNumber}
          isOptional
          placeholder={text.serialNumberPlaceholder}
        />
        <EquipmentTextField
          name="powerKw"
          label={text.power}
          unit={text.powerUnit}
          isOptional
          inputMode="decimal"
        />
      </FieldRow>
      {isHeatPumpKind(kind) ? null : (
        <FieldRow>
          <EquipmentTextField name="room" label={text.room} placeholder={text.roomPlaceholder} />
        </FieldRow>
      )}
    </>
  );
};

export const HeatPumpFields = () => (
  <>
    <FieldRow>
      <EquipmentTextField
        name="refrigerant"
        label={text.refrigerant}
        isOptional
        placeholder="R32"
      />
      <EquipmentTextField
        name="refrigerantCharge"
        label={text.refrigerantCharge}
        unit={text.refrigerantChargeUnit}
        isOptional
        inputMode="decimal"
      />
    </FieldRow>
    <FieldRow>
      <EquipmentTextField name="outdoorUnitLocation" label={text.outdoorUnit} isOptional />
      <EquipmentTextField name="indoorUnitLocation" label={text.indoorUnit} isOptional />
    </FieldRow>
  </>
);

const FlueTypeSelect = () => {
  const { field } = useController<EquipmentFormValues, "flueType">({ name: "flueType" });
  return (
    <Select value={field.value ?? ""} onValueChange={field.onChange}>
      <SelectTrigger id="equipment-flueType" className={SELECT_TRIGGER_CLASS}>
        <SelectValue placeholder={text.flueTypePlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {FLUE_TYPES.map((flueType) => (
          <SelectItem key={flueType} value={flueType} className="min-h-12 lg:min-h-8">
            {FLUE_TYPE_LABELS[flueType]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const FlueFields = () => (
  <Fieldset title={text.flueSection}>
    <FieldRow>
      <FormField id="equipment-flueType" label={text.flueType}>
        <FlueTypeSelect />
      </FormField>
      <EquipmentTextField
        name="flueLocation"
        label={text.flueLocation}
        isOptional
        placeholder={text.flueLocationPlaceholder}
      />
    </FieldRow>
  </Fieldset>
);
