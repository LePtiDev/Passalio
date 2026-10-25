import { LEGAL_FORMS, REGISTRY_KINDS, requiresShareCapital } from "@passalio/trades";
import { useFormContext, useWatch } from "react-hook-form";
import { FIELD_CLASS } from "@/components/field-styles";
import { describedBy, FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import type { CompanySettingsValues } from "../../company-settings-form";
import { LEGAL_FORM_LABELS, REGISTRY_LABELS, settingsFr } from "../../settings-fr";
import { ChoiceSelect } from "./choice-select";

const text = settingsFr.company;

const fieldClass = FIELD_CLASS;

export const CompanyFields = ({ canEdit }: { readonly canEdit: boolean }) => {
  const form = useFormContext<CompanySettingsValues>();
  const { errors } = form.formState;
  const [legalForm, registryKind] = useWatch({
    control: form.control,
    name: ["legalForm", "registryKind"],
  });
  const needsCapital = legalForm !== null && requiresShareCapital(legalForm);
  return (
    <fieldset disabled={!canEdit} className="grid gap-4 lg:grid-cols-2">
      <FormField id="company-name" label={text.name} isRequired error={errors.name?.message}>
        <Input
          id="company-name"
          className={fieldClass}
          aria-invalid={errors.name !== undefined}
          aria-describedby={describedBy("company-name", errors.name?.message)}
          {...form.register("name")}
        />
      </FormField>
      <FormField
        id="company-legal-form"
        label={text.legalForm}
        isRequired
        error={errors.legalForm?.message}
      >
        <ChoiceSelect
          id="company-legal-form"
          name="legalForm"
          choices={LEGAL_FORMS}
          labels={LEGAL_FORM_LABELS}
          placeholder={text.legalFormPlaceholder}
          error={errors.legalForm?.message}
        />
      </FormField>
      <FormField
        id="company-siret"
        label={text.siret}
        isRequired
        error={errors.siret?.message}
        hint={text.siretHint}
      >
        <Input
          id="company-siret"
          inputMode="numeric"
          className={`${fieldClass} tabular-nums`}
          aria-invalid={errors.siret !== undefined}
          aria-describedby={describedBy("company-siret", errors.siret?.message, text.siretHint)}
          {...form.register("siret")}
        />
      </FormField>
      <FormField
        id="company-capital"
        label={text.shareCapital}
        isRequired={needsCapital}
        error={errors.shareCapital?.message}
        hint={text.shareCapitalHint}
      >
        <Input
          id="company-capital"
          inputMode="numeric"
          className={`${fieldClass} tabular-nums`}
          aria-invalid={errors.shareCapital !== undefined}
          aria-describedby={describedBy(
            "company-capital",
            errors.shareCapital?.message,
            text.shareCapitalHint,
          )}
          {...form.register("shareCapital")}
        />
      </FormField>
      <FormField
        id="company-registry"
        label={text.registry}
        isRequired
        error={errors.registryKind?.message}
        hint={text.registryHint}
      >
        <ChoiceSelect
          id="company-registry"
          name="registryKind"
          choices={REGISTRY_KINDS}
          labels={REGISTRY_LABELS}
          placeholder={text.registryPlaceholder}
          error={errors.registryKind?.message}
        />
      </FormField>
      {registryKind === "rcs" ? (
        <FormField
          id="company-registry-city"
          label={text.registryCity}
          isRequired
          error={errors.registryCity?.message}
        >
          <Input
            id="company-registry-city"
            className={fieldClass}
            aria-invalid={errors.registryCity !== undefined}
            aria-describedby={describedBy("company-registry-city", errors.registryCity?.message)}
            {...form.register("registryCity")}
          />
        </FormField>
      ) : null}
      <FormField id="company-ape" label={text.apeCode} error={errors.apeCode?.message}>
        <Input
          id="company-ape"
          className={`${fieldClass} uppercase`}
          aria-invalid={errors.apeCode !== undefined}
          aria-describedby={describedBy("company-ape", errors.apeCode?.message)}
          {...form.register("apeCode")}
        />
      </FormField>
      <div className="lg:col-span-2">
        <FormField
          id="company-address"
          label={text.address}
          isRequired
          error={errors.address?.message}
        >
          <Input
            id="company-address"
            autoComplete="street-address"
            className={fieldClass}
            aria-invalid={errors.address !== undefined}
            aria-describedby={describedBy("company-address", errors.address?.message)}
            {...form.register("address")}
          />
        </FormField>
      </div>
    </fieldset>
  );
};
