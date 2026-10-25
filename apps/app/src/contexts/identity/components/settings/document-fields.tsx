import { FileText } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { FIELD_CLASS } from "@/components/field-styles";
import { describedBy, FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { nextCertificateNumber, type DocumentSettingsValues } from "../../document-settings-form";
import { settingsFr } from "../../settings-fr";
import { SettingsCard } from "./settings-layout";

const text = settingsFr.documents;

const TEXTAREA_CLASS = `${FIELD_CLASS} h-auto min-h-24 py-3 lg:h-auto lg:min-h-20 lg:py-2`;

type TextFieldName = "phone" | "contactEmail" | "website" | "qualification";

const TextField = ({
  name,
  label,
  hint,
  type = "text",
  autoComplete,
}: {
  readonly name: TextFieldName;
  readonly label: string;
  readonly hint?: string;
  readonly type?: "text" | "email" | "tel" | "url";
  readonly autoComplete?: string;
}) => {
  const form = useFormContext<DocumentSettingsValues>();
  const error = form.formState.errors[name]?.message;
  const id = `document-${name}`;
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        className={FIELD_CLASS}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...form.register(name)}
      />
    </FormField>
  );
};

export const ContactFields = () => (
  <SettingsCard title={text.contact} subtitle={text.contactText}>
    <div className="grid gap-4 lg:grid-cols-2">
      <TextField name="phone" label={text.phone} type="tel" autoComplete="tel" />
      <TextField name="contactEmail" label={text.email} type="email" autoComplete="email" />
      <TextField name="website" label={text.website} autoComplete="url" />
      <TextField name="qualification" label={text.qualification} hint={text.qualificationHint} />
    </div>
  </SettingsCard>
);

const LongTextField = ({
  name,
  label,
  hint,
}: {
  readonly name: "customerMessage" | "footerText";
  readonly label: string;
  readonly hint: string;
}) => {
  const form = useFormContext<DocumentSettingsValues>();
  const error = form.formState.errors[name]?.message;
  const id = `document-${name}`;
  return (
    <FormField id={id} label={label} error={error} hint={hint}>
      <Textarea
        id={id}
        rows={3}
        className={TEXTAREA_CLASS}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...form.register(name)}
      />
    </FormField>
  );
};

export const TextsFields = () => (
  <SettingsCard title={text.texts}>
    <LongTextField
      name="customerMessage"
      label={text.customerMessage}
      hint={text.customerMessageHint}
    />
    <LongTextField name="footerText" label={text.footerText} hint={text.footerTextHint} />
  </SettingsCard>
);

export const AdviceNote = () => (
  <SettingsCard title={text.advice}>
    <p className="flex gap-3 text-sm text-[#475569] lg:text-[13px]">
      <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#0E7C5A]" />
      {text.adviceText}
    </p>
  </SettingsCard>
);

export const NumberingFields = ({
  hasReservedNumbers,
}: {
  readonly hasReservedNumbers: boolean;
}) => {
  const form = useFormContext<DocumentSettingsValues>();
  const { errors } = form.formState;
  const [documentNumberPrefix, nextDocumentNumber] = useWatch({
    control: form.control,
    name: ["documentNumberPrefix", "nextDocumentNumber"],
  });
  const next = nextCertificateNumber({ documentNumberPrefix, nextDocumentNumber });
  return (
    <SettingsCard title={text.numbering}>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="document-prefix"
          label={text.prefix}
          isRequired
          error={errors.documentNumberPrefix?.message}
        >
          <Input
            id="document-prefix"
            className={FIELD_CLASS}
            aria-invalid={errors.documentNumberPrefix !== undefined}
            aria-describedby={describedBy("document-prefix", errors.documentNumberPrefix?.message)}
            {...form.register("documentNumberPrefix")}
          />
        </FormField>
        <FormField
          id="document-next-number"
          label={text.nextNumber}
          isRequired
          error={errors.nextDocumentNumber?.message}
        >
          <Input
            id="document-next-number"
            inputMode="numeric"
            className={`${FIELD_CLASS} tabular-nums`}
            aria-invalid={errors.nextDocumentNumber !== undefined}
            aria-describedby={describedBy(
              "document-next-number",
              errors.nextDocumentNumber?.message,
            )}
            {...form.register("nextDocumentNumber")}
          />
        </FormField>
      </div>
      <p className="text-[13px] text-[#64748B]">
        {text.nextCertificate(next)}{" "}
        {hasReservedNumbers ? text.numberingLocked : text.numberingText}
      </p>
    </SettingsCard>
  );
};
