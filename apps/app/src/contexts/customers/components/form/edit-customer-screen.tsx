import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/page-skeleton";
import { useLocalSession } from "@/lib/db/local-database-context";
import type { CustomerRecord } from "@/lib/db/local-records";
import { updateCustomer } from "../../customer-store";
import { customerNameOf } from "../../customer-view";
import { customersFr } from "../../fr";
import { useCustomerFile } from "../../hooks/use-customer-file";
import { CustomerNotFound } from "../file/customer-not-found";
import {
  customerFormOf,
  editCustomerFormSchema,
  toCustomerFields,
  type EditCustomerFormValues,
} from "./customer-form-schema";
import { BillingFields, CustomerFields, NotesField } from "./customer-fields";
import { Fieldset, FormShell } from "./form-shell";

const text = customersFr.form;

const EditCustomerForm = ({ customer }: { readonly customer: CustomerRecord }) => {
  const { database } = useLocalSession();
  const navigate = useNavigate();
  const form = useForm<EditCustomerFormValues>({
    resolver: zodResolver(editCustomerFormSchema),
    defaultValues: { customer: customerFormOf(customer) },
  });
  const backToFile = useCallback(() => {
    void navigate({ to: "/clients/$customerId", params: { customerId: customer.id } });
  }, [navigate, customer.id]);
  const submit = form.handleSubmit(async (values) => {
    try {
      const fields = toCustomerFields(values.customer);
      await updateCustomer(database, customer.id, fields);
      toast.success(customersFr.toasts.customerUpdated);
      backToFile();
    } catch {
      toast.error(text.errors.saveFailed);
    }
  });
  const trail = [
    { label: customersFr.list.title, to: "/clients" },
    { label: customerNameOf(customer) },
    { label: text.editCustomerTitle },
  ] as const;
  return (
    <FormProvider {...form}>
      <FormShell
        title={text.editCustomerTitle}
        note={text.editNote}
        trail={trail}
        primaryLabel={text.saveChanges}
        isSubmitting={form.formState.isSubmitting}
        onSubmit={submit}
        onCancel={backToFile}
      >
        <Fieldset title={text.customerSection} text={text.customerSectionText}>
          <CustomerFields />
          <BillingFields />
          <NotesField />
        </Fieldset>
      </FormShell>
    </FormProvider>
  );
};

export const EditCustomerScreen = ({ customerId }: { readonly customerId: string }) => {
  const file = useCustomerFile(customerId);
  if (file === undefined) {
    return (
      <div className="mx-auto w-full max-w-[600px] p-4 lg:py-8">
        <FormSkeleton />
      </div>
    );
  }
  return file === null ? <CustomerNotFound /> : <EditCustomerForm customer={file.customer} />;
};
