import type { UseFormReturn } from "react-hook-form";
import { describedBy, FIELD_CLASS, Fieldset, FormField } from "@/contexts/customers";
import { Input } from "@/components/ui/input";
import type { CertificateFormValues } from "../../certificate-form";
import { complianceFr } from "../../fr";
import { CheckRow } from "../check-row";

const text = complianceFr.form;

const FLUE_ID = "certificate-flue";

export const FlueSection = ({ form }: { readonly form: UseFormReturn<CertificateFormValues> }) => {
  const error = form.formState.errors.flueDesignation?.message;
  return (
    <Fieldset title={text.flueSection}>
      <FormField id={FLUE_ID} label={text.flue} isRequired error={error} hint={text.flueHint}>
        <Input
          id={FLUE_ID}
          placeholder={text.fluePlaceholder}
          aria-required="true"
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={describedBy(FLUE_ID, error, text.flueHint)}
          className={FIELD_CLASS}
          {...form.register("flueDesignation")}
        />
      </FormField>
      <div className="flex flex-col">
        <CheckRow control={form.control} name="isConnectionPipeSwept" label={text.connectionPipe} />
        <CheckRow
          control={form.control}
          name="isMechanicalSweeping"
          label={text.mechanical}
          hint={text.mechanicalHint}
          isRequired
        />
      </div>
    </Fieldset>
  );
};
