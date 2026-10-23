import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useLocalSession } from "@/lib/db/local-database-context";
import { createCustomer } from "../../customer-store";
import { customersFr } from "../../fr";
import {
  customerFormOf,
  emptySiteForm,
  newCustomerFormSchema,
  toCustomerFields,
  toSiteFields,
  type NewCustomerFormValues,
} from "./customer-form-schema";
import { BillingFields, CustomerFields } from "./customer-fields";
import { Fieldset, FormShell } from "./form-shell";
import { SiteFields } from "./site-fields";

const text = customersFr.form;

const TRAIL = [
  { label: customersFr.list.title, to: "/clients" },
  { label: text.customerTitle },
] as const;

export const NewCustomerScreen = ({ initialName }: { readonly initialName: string }) => {
  const { database, actor } = useLocalSession();
  const navigate = useNavigate();
  const form = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerFormSchema),
    defaultValues: { customer: customerFormOf(null, initialName), site: emptySiteForm() },
  });
  const cancel = useCallback(() => {
    void navigate({ to: "/clients" });
  }, [navigate]);
  const submit = form.handleSubmit(async (values) => {
    try {
      const { customerId } = await createCustomer(database, actor, {
        customer: toCustomerFields(values.customer),
        site: toSiteFields(values.site),
      });
      toast.success(customersFr.toasts.customerCreated);
      await navigate({ to: "/clients/$customerId", params: { customerId } });
    } catch {
      toast.error(text.errors.saveFailed);
    }
  });
  return (
    <FormProvider {...form}>
      <FormShell
        title={text.customerTitle}
        note={text.customerNote}
        trail={TRAIL}
        primaryLabel={text.saveCustomer}
        isSubmitting={form.formState.isSubmitting}
        onSubmit={submit}
        onCancel={cancel}
      >
        <Fieldset title={text.customerSection} text={text.customerSectionText}>
          <CustomerFields />
        </Fieldset>
        <Fieldset title={text.addressSection} text={text.addressSectionText}>
          <SiteFields hasSiteDetails={false} />
          <BillingFields />
        </Fieldset>
      </FormShell>
    </FormProvider>
  );
};
