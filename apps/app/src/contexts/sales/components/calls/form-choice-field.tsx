import { useController, useFormContext, useWatch } from "react-hook-form";
import { callsFr } from "../../fr-calls";
import type { CallFormValues } from "./call-form-schema";
import { ChoiceField, type ChoiceOption } from "./choice-field";
import { INTEREST_OPTIONS } from "./qualification-options";

type ChoiceName = "outcome" | "nextAction" | "interest";

type FormChoiceFieldProps = {
  readonly name: ChoiceName;
  readonly id: string;
  readonly label: string;
  readonly options: readonly ChoiceOption<string>[];
  readonly isRequired: boolean;
  readonly layout?: "fill" | "wrap" | undefined;
};

export const FormChoiceField = ({
  name,
  id,
  label,
  options,
  isRequired,
  layout,
}: FormChoiceFieldProps) => {
  const { field, fieldState } = useController<CallFormValues, ChoiceName>({ name });
  return (
    <ChoiceField
      id={id}
      label={label}
      options={options}
      value={field.value === "" ? null : field.value}
      onChange={field.onChange}
      isRequired={isRequired}
      error={fieldState.error?.message}
      layout={layout}
    />
  );
};

export const InterestField = ({ layout }: { readonly layout: "fill" | "wrap" }) => {
  const { control } = useFormContext<CallFormValues>();
  const outcome = useWatch({ control, name: "outcome" });
  return (
    <FormChoiceField
      name="interest"
      id="call-interest"
      label={callsFr.qualification.interest.label}
      options={INTEREST_OPTIONS}
      isRequired={outcome === "answered"}
      layout={layout}
    />
  );
};
