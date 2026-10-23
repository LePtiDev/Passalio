import { useCallback } from "react";
import { useController, useWatch } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EquipmentRecord } from "@/lib/db/local-records";
import { equipmentNameOf } from "../../customer-view";
import { customersFr } from "../../fr";
import { SELECT_TRIGGER_CLASS } from "../customer-styles";
import { SegmentedControl, type Choice } from "../form/choice-controls";
import { FormField } from "../form/form-field";
import { FieldRow, Fieldset } from "../form/form-shell";
import { NO_REPLACEMENT, type EquipmentFormValues } from "./equipment-form-schema";
import { EquipmentTextField } from "./equipment-text-field";

const text = customersFr.equipmentForm;

type InstallationChoice = "in_place" | "by_us";

const INSTALLATION_CHOICES: readonly Choice<InstallationChoice>[] = [
  { value: "in_place", label: text.alreadyInPlace },
  { value: "by_us", label: text.installedByUs },
];

const ReplacesSelect = ({ candidates }: { readonly candidates: readonly EquipmentRecord[] }) => {
  const { field } = useController<EquipmentFormValues, "replacesEquipmentId">({
    name: "replacesEquipmentId",
  });
  return (
    <Select value={field.value} onValueChange={field.onChange}>
      <SelectTrigger id="equipment-replaces" className={SELECT_TRIGGER_CLASS}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_REPLACEMENT} className="min-h-12 lg:min-h-8">
          {text.replacesNothing}
        </SelectItem>
        {candidates.map((equipment) => (
          <SelectItem key={equipment.id} value={equipment.id} className="min-h-12 lg:min-h-8">
            {equipmentNameOf(equipment)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const InstallationChoiceField = () => {
  const { field } = useController<EquipmentFormValues, "isInstalledByUs">({
    name: "isInstalledByUs",
  });
  const { onChange } = field;
  const choose = useCallback(
    (choice: InstallationChoice) => onChange(choice === "by_us"),
    [onChange],
  );
  return (
    <SegmentedControl
      label={text.installation}
      choices={INSTALLATION_CHOICES}
      value={field.value ? "by_us" : "in_place"}
      onChange={choose}
    />
  );
};

export const InstallationFields = ({
  candidates,
}: {
  readonly candidates: readonly EquipmentRecord[];
}) => {
  const isInstalledByUs = useWatch<EquipmentFormValues, "isInstalledByUs">({
    name: "isInstalledByUs",
  });
  return (
    <Fieldset title={text.installation}>
      <InstallationChoiceField />
      <FieldRow>
        {isInstalledByUs ? (
          <>
            <EquipmentTextField name="commissionedOn" label={text.commissionedOn} type="date" />
            <FormField id="equipment-replaces" label={text.replaces} hint={text.replacesHint}>
              <ReplacesSelect candidates={candidates} />
            </FormField>
          </>
        ) : (
          <EquipmentTextField
            name="installationYear"
            label={text.installationYear}
            isOptional
            inputMode="numeric"
            placeholder={text.installationYearPlaceholder}
          />
        )}
      </FieldRow>
    </Fieldset>
  );
};
