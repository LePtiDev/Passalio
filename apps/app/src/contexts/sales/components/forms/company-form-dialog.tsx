import { zodResolver } from "@hookform/resolvers/zod";
import type { ProspectCompanyResponse } from "@passalio/shared";
import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { salesFr } from "../../fr";
import {
  useCreateCompany,
  useDeleteCompany,
  useUpdateCompany,
} from "../../hooks/use-sales-mutations";
import {
  companyFormOf,
  companyFormSchema,
  EMPTY_COMPANY_FORM,
  ownerOf,
  toCompanyFields,
  type CompanyFormValues,
} from "./company-form-schema";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { FormDialog } from "./form-dialog";
import { FormTextField } from "./form-text-field";
import { OwnerField } from "./owner-field";

const text = salesFr.companyForm;

type Field = Parameters<typeof FormTextField<CompanyFormValues>>[0];

const OPTIONAL = text.optional;

const FIELDS: readonly Field[] = [
  { name: "name", label: text.name, className: "lg:col-span-2", autoComplete: "organization" },
  { name: "address", label: text.address, optionalLabel: OPTIONAL, className: "lg:col-span-2" },
  { name: "postalCode", label: text.postalCode, optionalLabel: OPTIONAL, inputMode: "numeric" },
  { name: "city", label: text.city, optionalLabel: OPTIONAL },
  { name: "department", label: text.department, hint: text.departmentHint },
  { name: "phone", label: text.phone, optionalLabel: OPTIONAL, type: "tel", inputMode: "tel" },
  { name: "email", label: text.email, optionalLabel: OPTIONAL, type: "email", inputMode: "email" },
  { name: "website", label: text.website, optionalLabel: OPTIONAL, inputMode: "url" },
  { name: "activity", label: text.activity, optionalLabel: OPTIONAL },
  { name: "headcount", label: text.headcount, optionalLabel: OPTIONAL },
  {
    name: "currentTool",
    label: text.currentTool,
    optionalLabel: OPTIONAL,
    placeholder: text.currentToolPlaceholder,
  },
  { name: "siren", label: text.siren, optionalLabel: OPTIONAL, inputMode: "numeric" },
];

type CompanyFormDialogProps = {
  readonly company: ProspectCompanyResponse | null;
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
};

const DeleteCompanyButton = ({ company }: { readonly company: ProspectCompanyResponse }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const navigate = useNavigate();
  const remove = useDeleteCompany();
  const { mutate } = remove;
  const open = useCallback(() => setIsConfirming(true), []);
  const confirm = useCallback(
    () =>
      mutate(
        { companyId: company.id, name: company.name },
        { onSuccess: () => void navigate({ to: "/admin/entreprises" }) },
      ),
    [mutate, company.id, company.name, navigate],
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
        title={text.deleteTitle(company.name)}
        description={text.deleteText}
        confirmLabel={text.delete}
        cancelLabel={text.cancel}
        onOpenChange={setIsConfirming}
        onConfirm={confirm}
      />
    </>
  );
};

export const CompanyFormDialog = ({ company, isOpen, onOpenChange }: CompanyFormDialogProps) => {
  const navigate = useNavigate();
  const create = useCreateCompany();
  const update = useUpdateCompany();
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: company === null ? EMPTY_COMPANY_FORM : companyFormOf(company),
  });
  const { reset } = form;
  useEffect(() => {
    if (isOpen) {
      reset(company === null ? EMPTY_COMPANY_FORM : companyFormOf(company));
    }
  }, [isOpen, company, reset]);
  const save = async (values: CompanyFormValues) => {
    const fields = toCompanyFields(values);
    if (company === null) {
      const created = await create.mutateAsync(fields);
      onOpenChange(false);
      await navigate({ to: "/admin/entreprises/$companyId", params: { companyId: created.id } });
      return;
    }
    await update.mutateAsync({
      companyId: company.id,
      changes: { ...fields, ownerUserId: ownerOf(values) },
    });
    onOpenChange(false);
  };
  const aside = useMemo(
    () => (company === null ? null : <DeleteCompanyButton company={company} />),
    [company],
  );
  const submit = form.handleSubmit(async (values) => save(values).catch(() => undefined));
  return (
    <FormProvider {...form}>
      <FormDialog
        isOpen={isOpen}
        title={company === null ? text.createTitle : text.editTitle}
        description={text.description}
        submitLabel={company === null ? text.create : text.save}
        cancelLabel={text.cancel}
        isSubmitting={form.formState.isSubmitting}
        aside={aside}
        onOpenChange={onOpenChange}
        onSubmit={submit}
      >
        {FIELDS.map((field) => (
          <FormTextField<CompanyFormValues> key={field.name} {...field} />
        ))}
        {company === null ? null : <OwnerField />}
      </FormDialog>
    </FormProvider>
  );
};
