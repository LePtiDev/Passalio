import { useCallback } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CIVILITY_LABELS, customersFr } from "../../fr";
import { FIELD_CLASS, LABEL_CLASS } from "../customer-styles";
import { SegmentedControl, type Choice } from "./choice-controls";
import type { CustomerFormValues } from "./customer-form-schema";
import { describedBy, FormField } from "@/components/form-field";
import { FieldRow } from "./form-shell";

const text = customersFr.form;

type CustomerForm = { readonly customer: CustomerFormValues };

type CivilityChoice = "mrs" | "mr" | "unknown";

const KIND_CHOICES: readonly Choice<CustomerFormValues["kind"]>[] = [
  { value: "individual", label: text.kinds.individual },
  { value: "company", label: text.kinds.company },
];

const CIVILITY_CHOICES: readonly Choice<CivilityChoice>[] = [
  { value: "mrs", label: CIVILITY_LABELS.mrs },
  { value: "mr", label: CIVILITY_LABELS.mr },
  { value: "unknown", label: text.civilityUnknown },
];

const civilityOf = (choice: CivilityChoice) => (choice === "unknown" ? null : choice);

const CustomerKindField = () => {
  const { field } = useController<CustomerForm, "customer.kind">({ name: "customer.kind" });
  return (
    <SegmentedControl
      label={text.customerSection}
      choices={KIND_CHOICES}
      value={field.value}
      onChange={field.onChange}
    />
  );
};

const CivilityField = () => {
  const { field } = useController<CustomerForm, "customer.civility">({
    name: "customer.civility",
  });
  const { onChange } = field;
  const choose = useCallback((choice: CivilityChoice) => onChange(civilityOf(choice)), [onChange]);
  return (
    <SegmentedControl
      label={text.civility}
      choices={CIVILITY_CHOICES}
      value={field.value ?? "unknown"}
      onChange={choose}
      className="lg:w-[320px]"
    />
  );
};

const DifferentBillingField = () => {
  const { field } = useController<CustomerForm, "customer.hasDifferentBilling">({
    name: "customer.hasDifferentBilling",
  });
  const { onChange } = field;
  const toggle = useCallback(
    (checked: boolean | "indeterminate") => onChange(checked === true),
    [onChange],
  );
  return (
    <label className="flex min-h-12 items-center gap-3 text-[15px] lg:min-h-0 lg:text-[13px]">
      <Checkbox checked={field.value} onCheckedChange={toggle} className="size-5 lg:size-4" />
      {text.differentBilling}
    </label>
  );
};

export const CustomerFields = () => {
  const form = useFormContext<CustomerForm>();
  const errors = form.formState.errors.customer;
  const kind = useWatch({ control: form.control, name: "customer.kind" });
  const isCompany = kind === "company";
  return (
    <>
      <CustomerKindField />
      <div className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>
          {text.civility} <span className="font-normal text-[#64748B]">{text.optional}</span>
        </span>
        <CivilityField />
      </div>
      {isCompany ? (
        <FieldRow>
          <FormField
            id="company-name"
            label={text.companyName}
            error={errors?.companyName?.message}
          >
            <Input
              id="company-name"
              autoComplete="organization"
              aria-invalid={errors?.companyName !== undefined}
              aria-describedby={describedBy("company-name", errors?.companyName?.message)}
              className={FIELD_CLASS}
              {...form.register("customer.companyName")}
            />
          </FormField>
          <FormField id="contact-name" label={text.contactName} isOptional>
            <Input
              id="contact-name"
              autoComplete="name"
              className={FIELD_CLASS}
              {...form.register("customer.lastName")}
            />
          </FormField>
        </FieldRow>
      ) : (
        <FieldRow>
          <FormField id="first-name" label={text.firstName}>
            <Input
              id="first-name"
              autoComplete="given-name"
              placeholder={text.firstNamePlaceholder}
              className={FIELD_CLASS}
              {...form.register("customer.firstName")}
            />
          </FormField>
          <FormField id="last-name" label={text.lastName} error={errors?.lastName?.message}>
            <Input
              id="last-name"
              autoComplete="family-name"
              aria-invalid={errors?.lastName !== undefined}
              aria-describedby={describedBy("last-name", errors?.lastName?.message)}
              className={FIELD_CLASS}
              {...form.register("customer.lastName")}
            />
          </FormField>
        </FieldRow>
      )}
      <FieldRow>
        <FormField id="phone" label={text.phone} error={errors?.phone?.message}>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={errors?.phone !== undefined}
            aria-describedby={describedBy("phone", errors?.phone?.message)}
            className={`${FIELD_CLASS} tabular-nums`}
            {...form.register("customer.phone")}
          />
        </FormField>
        <FormField
          id="email"
          label={text.email}
          isOptional
          error={errors?.email?.message}
          hint={text.emailHint}
        >
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={text.emailPlaceholder}
            aria-invalid={errors?.email !== undefined}
            aria-describedby={describedBy("email", errors?.email?.message, text.emailHint)}
            className={FIELD_CLASS}
            {...form.register("customer.email")}
          />
        </FormField>
      </FieldRow>
    </>
  );
};

export const BillingFields = () => {
  const form = useFormContext<CustomerForm>();
  const hasDifferentBilling = useWatch({
    control: form.control,
    name: "customer.hasDifferentBilling",
  });
  return (
    <>
      <DifferentBillingField />
      {hasDifferentBilling ? (
        <FormField id="billing-address" label={text.billingAddress}>
          <Input
            id="billing-address"
            autoComplete="street-address"
            className={FIELD_CLASS}
            {...form.register("customer.billingAddress")}
          />
        </FormField>
      ) : null}
    </>
  );
};

export const NotesField = () => {
  const form = useFormContext<CustomerForm>();
  return (
    <FormField id="notes" label={text.notes} isOptional>
      <Input
        id="notes"
        placeholder={text.notesPlaceholder}
        className={FIELD_CLASS}
        {...form.register("customer.notes")}
      />
    </FormField>
  );
};
