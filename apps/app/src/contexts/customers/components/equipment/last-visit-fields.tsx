import { useWatch } from "react-hook-form";
import { customersFr } from "../../fr";
import { FieldRow, Fieldset } from "../form/form-shell";
import { visitFieldsOf, type EquipmentFormValues } from "./equipment-form-schema";
import { EquipmentTextField } from "./equipment-text-field";

const text = customersFr.equipmentForm;

export const LastVisitFields = () => {
  const [kind, isInstalledByUs] = useWatch<EquipmentFormValues, ["kind", "isInstalledByUs"]>({
    name: ["kind", "isInstalledByUs"],
  });
  const { hasSweeping, hasService } = visitFieldsOf(kind, isInstalledByUs);
  if (!hasSweeping && !hasService) {
    return null;
  }
  return (
    <Fieldset title={text.lastVisit} text={text.lastVisitText}>
      <FieldRow>
        {hasSweeping ? (
          <EquipmentTextField
            name="lastSweepingOn"
            label={text.lastSweeping}
            isOptional
            type="date"
          />
        ) : null}
        {hasService ? (
          <EquipmentTextField
            name="lastServiceOn"
            label={text.lastService}
            isOptional
            type="date"
          />
        ) : null}
      </FieldRow>
    </Fieldset>
  );
};
