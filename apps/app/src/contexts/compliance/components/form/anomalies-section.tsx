import { useCallback } from "react";
import { useController, type UseFormReturn } from "react-hook-form";
import { describedBy, FIELD_CLASS, Fieldset, FormField } from "@/contexts/customers";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ANOMALY_KINDS,
  type AnomalyKind,
  type CertificateFormValues,
} from "../../certificate-form";
import { ANOMALY_LABELS, complianceFr } from "../../fr";

const text = complianceFr.form;

const DETAILS_ID = "certificate-anomaly-details";

const DO_NOT_USE_ID = "certificate-do-not-use";

const AnomalyChip = ({
  kind,
  isSelected,
  onToggle,
}: {
  readonly kind: AnomalyKind;
  readonly isSelected: boolean;
  readonly onToggle: (kind: AnomalyKind) => void;
}) => {
  const toggle = useCallback(() => onToggle(kind), [onToggle, kind]);
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={toggle}
      className="h-12 rounded-[10px] border border-[#E3E8EF] bg-white px-4 text-[15px] font-medium text-[#0F2A44] aria-pressed:border-[#0E7C5A] aria-pressed:bg-[#E6F4EE] aria-pressed:font-semibold aria-pressed:text-[#0E7C5A] lg:h-8 lg:rounded-[7px] lg:px-3 lg:text-[13px]"
    >
      {ANOMALY_LABELS[kind]}
    </button>
  );
};

const DoNotUseCard = ({ form }: { readonly form: UseFormReturn<CertificateFormValues> }) => {
  const { field } = useController({ control: form.control, name: "isDoNotUse" });
  return (
    <label
      htmlFor={DO_NOT_USE_ID}
      className="flex items-start gap-3 rounded-[12px] border border-[#E3E8EF] px-3.5 py-3 has-[[data-state=checked]]:border-[#B42318] has-[[data-state=checked]]:bg-[#FEF3F2] lg:rounded-lg"
    >
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold lg:text-[13px]">{text.doNotUse}</span>
        <span className="text-[13px] text-[#64748B]">{text.doNotUseText}</span>
      </span>
      <span className="-m-3 flex size-12 shrink-0 items-center justify-center">
        <Switch
          id={DO_NOT_USE_ID}
          checked={field.value}
          onCheckedChange={field.onChange}
          className="h-[26px] w-11 data-[state=checked]:bg-[#B42318] data-[state=unchecked]:bg-[#CBD5E1] lg:h-[22px] lg:w-10 [&>span]:size-[22px] lg:[&>span]:size-[18px]"
        />
      </span>
    </label>
  );
};

export const AnomaliesSection = ({
  form,
}: {
  readonly form: UseFormReturn<CertificateFormValues>;
}) => {
  const { field } = useController({ control: form.control, name: "anomalyKinds" });
  const { value: kinds, onChange } = field;
  const toggle = useCallback(
    (kind: AnomalyKind) =>
      onChange(
        kinds.includes(kind)
          ? kinds.filter((chosen) => chosen !== kind)
          : ANOMALY_KINDS.filter((candidate) => candidate === kind || kinds.includes(candidate)),
      ),
    [kinds, onChange],
  );
  const error = form.formState.errors.anomalyDetails?.message;
  return (
    <Fieldset title={text.anomaliesSection} text={text.anomaliesText}>
      <div className="flex flex-wrap gap-2">
        {ANOMALY_KINDS.map((kind) => (
          <AnomalyChip key={kind} kind={kind} isSelected={kinds.includes(kind)} onToggle={toggle} />
        ))}
      </div>
      {kinds.length === 0 ? null : (
        <FormField
          id={DETAILS_ID}
          label={text.anomalyDetails}
          isRequired={kinds.includes("other")}
          error={error}
        >
          <Input
            id={DETAILS_ID}
            placeholder={text.anomalyDetailsPlaceholder}
            aria-required={kinds.includes("other") ? true : undefined}
            aria-invalid={error === undefined ? undefined : true}
            aria-describedby={describedBy(DETAILS_ID, error)}
            className={FIELD_CLASS}
            {...form.register("anomalyDetails")}
          />
        </FormField>
      )}
      <DoNotUseCard form={form} />
    </Fieldset>
  );
};
