import { zodResolver } from "@hookform/resolvers/zod";
import type { ProspectContactResponse } from "@passalio/shared";
import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { salesFr } from "../../fr";
import { useAddContact, useDeleteContact, useUpdateContact } from "../../hooks/use-sales-mutations";
import { CompanyPickerField } from "./company-picker-field";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import {
  contactFormOf,
  contactFormSchema,
  emptyContactForm,
  toContactFields,
  type ContactFormValues,
} from "./contact-form-schema";
import { FormCheckField } from "./form-check-field";
import { FormDialog } from "./form-dialog";
import { FormTextField } from "./form-text-field";

const text = salesFr.contactForm;

type Field = Parameters<typeof FormTextField<ContactFormValues>>[0];

const OPTIONAL = text.optional;

const FIELDS: readonly Field[] = [
  { name: "firstName", label: text.firstName, optionalLabel: OPTIONAL, autoComplete: "off" },
  { name: "lastName", label: text.lastName },
  { name: "jobTitle", label: text.jobTitle, optionalLabel: OPTIONAL },
  { name: "phone", label: text.phone, optionalLabel: OPTIONAL, type: "tel", inputMode: "tel" },
  { name: "mobile", label: text.mobile, optionalLabel: OPTIONAL, type: "tel", inputMode: "tel" },
  { name: "email", label: text.email, optionalLabel: OPTIONAL, type: "email", inputMode: "email" },
  {
    name: "bestTime",
    label: text.bestTime,
    optionalLabel: OPTIONAL,
    placeholder: text.bestTimePlaceholder,
    className: "lg:col-span-2",
  },
];

const DeleteContactButton = ({ contact }: { readonly contact: ProspectContactResponse }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const navigate = useNavigate();
  const remove = useDeleteContact();
  const { mutate } = remove;
  const open = useCallback(() => setIsConfirming(true), []);
  const confirm = useCallback(
    () =>
      mutate(
        { contactId: contact.id, name: contact.name },
        {
          onSuccess: () =>
            void navigate({
              to: "/admin/entreprises/$companyId",
              params: { companyId: contact.companyId },
            }),
        },
      ),
    [mutate, contact.id, contact.name, contact.companyId, navigate],
  );
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-12 px-2 text-[15px] font-semibold text-[#B42318] hover:bg-[#FEF3F2] hover:text-[#B42318] lg:h-8 lg:text-[13px]"
        disabled={remove.isPending}
        onClick={open}
      >
        <Trash2 aria-hidden="true" />
        {text.delete}
      </Button>
      <ConfirmDeleteDialog
        isOpen={isConfirming}
        title={text.deleteTitle(contact.name)}
        description={text.deleteText}
        confirmLabel={text.delete}
        cancelLabel={text.cancel}
        onOpenChange={setIsConfirming}
        onConfirm={confirm}
      />
    </>
  );
};

type ContactFormDialogProps = {
  readonly companyId: string | null;
  readonly contact: ProspectContactResponse | null;
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
};

export const ContactFormDialog = ({
  companyId,
  contact,
  isOpen,
  onOpenChange,
}: ContactFormDialogProps) => {
  const navigate = useNavigate();
  const add = useAddContact();
  const update = useUpdateContact();
  const initialValues = useCallback(
    () => (contact === null ? emptyContactForm(companyId) : contactFormOf(contact)),
    [contact, companyId],
  );
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: initialValues(),
  });
  const { reset } = form;
  useEffect(() => {
    if (isOpen) {
      reset(initialValues());
    }
  }, [isOpen, initialValues, reset]);
  const save = async (values: ContactFormValues) => {
    const fields = toContactFields(values);
    if (contact === null) {
      const created = await add.mutateAsync({ companyId: values.companyId, fields });
      onOpenChange(false);
      if (companyId === null) {
        await navigate({ to: "/admin/contacts/$contactId", params: { contactId: created.id } });
      }
      return;
    }
    await update.mutateAsync({ contactId: contact.id, changes: fields });
    onOpenChange(false);
  };
  const aside = useMemo(
    () => (contact === null ? null : <DeleteContactButton contact={contact} />),
    [contact],
  );
  const submit = form.handleSubmit(async (values) => save(values).catch(() => undefined));
  return (
    <FormProvider {...form}>
      <FormDialog
        isOpen={isOpen}
        title={contact === null ? text.createTitle : text.editTitle}
        description={text.description}
        submitLabel={contact === null ? text.create : text.save}
        cancelLabel={text.cancel}
        isSubmitting={form.formState.isSubmitting}
        aside={aside}
        onOpenChange={onOpenChange}
        onSubmit={submit}
      >
        {companyId === null && contact === null ? <CompanyPickerField /> : null}
        {FIELDS.map((field) => (
          <FormTextField<ContactFormValues> key={field.name} {...field} />
        ))}
        <FormCheckField<ContactFormValues> name="isLeader" label={text.isLeader} />
        <FormCheckField<ContactFormValues> name="isMain" label={text.isMain} />
      </FormDialog>
    </FormProvider>
  );
};
