import { CHIMNEY_STACK_STATES } from "@passalio/trades";
import { TriangleAlert } from "lucide-react";
import { useController, type UseFormReturn } from "react-hook-form";
import { describedBy, FIELD_CLASS, Fieldset, FormField } from "@/contexts/customers";
import { HINT_TEXT_CLASS } from "@/components/field-styles";
import { Input } from "@/components/ui/input";
import { FORM_EXTENTS, type CertificateFormValues } from "../../certificate-form";
import { complianceFr, EXTENT_LABELS, STACK_LABELS } from "../../fr";
import { SegmentedField } from "../segmented-field";

const text = complianceFr.form;

const UNSWEPT_ID = "certificate-unswept-part";

const EXTENT_OPTIONS = FORM_EXTENTS.map((value) => ({ value, label: EXTENT_LABELS[value] }));

const STACK_OPTIONS = CHIMNEY_STACK_STATES.map((value) => ({ value, label: STACK_LABELS[value] }));

export const ResultSection = ({
  form,
}: {
  readonly form: UseFormReturn<CertificateFormValues>;
}) => {
  const extent = useController({ control: form.control, name: "sweepingExtent" }).field;
  const stacks = useController({ control: form.control, name: "chimneyStacks" }).field;
  const error = form.formState.errors.unsweptPart?.message;
  return (
    <>
      <Fieldset title={text.resultSection} text={text.resultText}>
        <SegmentedField
          name="sweepingExtent"
          label={text.resultSection}
          options={EXTENT_OPTIONS}
          value={extent.value}
          onChange={extent.onChange}
        />
        {extent.value === "full_length" ? (
          <p className={HINT_TEXT_CLASS}>{text.fullLengthNote}</p>
        ) : (
          <>
            <FormField id={UNSWEPT_ID} label={text.unsweptPart} isRequired error={error}>
              <Input
                id={UNSWEPT_ID}
                placeholder={text.unsweptPartPlaceholder}
                aria-required="true"
                aria-invalid={error === undefined ? undefined : true}
                aria-describedby={describedBy(UNSWEPT_ID, error)}
                className={FIELD_CLASS}
                {...form.register("unsweptPart")}
              />
            </FormField>
            <p className="flex items-start gap-2.5 rounded-[10px] border border-[#F5D9A8] bg-[#FFF8EB] px-3.5 py-3 text-[15px] text-[#92400E] lg:rounded-lg lg:text-[13px]">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {text.partialWarning}
            </p>
          </>
        )}
      </Fieldset>
      <Fieldset title={text.stacksSection} text={text.stacksText}>
        <SegmentedField
          name="chimneyStacks"
          label={text.stacksSection}
          options={STACK_OPTIONS}
          value={stacks.value}
          onChange={stacks.onChange}
        />
      </Fieldset>
    </>
  );
};
