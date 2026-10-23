import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/page-skeleton";
import { useLocalSession } from "@/lib/db/local-database-context";
import type { CustomerRecord } from "@/lib/db/local-records";
import { addSite } from "../../customer-store";
import { customerNameOf } from "../../customer-view";
import { customersFr } from "../../fr";
import { useCustomerFile } from "../../hooks/use-customer-file";
import { CustomerNotFound } from "../file/customer-not-found";
import {
  emptySiteForm,
  siteOnlyFormSchema,
  toSiteFields,
  type SiteOnlyFormValues,
} from "./customer-form-schema";
import { Fieldset, FormShell } from "./form-shell";
import { SiteFields } from "./site-fields";

const text = customersFr.form;

const NewSiteForm = ({ customer }: { readonly customer: CustomerRecord }) => {
  const { database, actor } = useLocalSession();
  const navigate = useNavigate();
  const form = useForm<SiteOnlyFormValues>({
    resolver: zodResolver(siteOnlyFormSchema),
    defaultValues: { site: emptySiteForm() },
  });
  const backToFile = useCallback(() => {
    void navigate({ to: "/clients/$customerId", params: { customerId: customer.id } });
  }, [navigate, customer.id]);
  const submit = form.handleSubmit(async (values) => {
    try {
      await addSite(database, actor, customer.id, toSiteFields(values.site));
      toast.success(customersFr.toasts.siteCreated);
      backToFile();
    } catch {
      toast.error(text.errors.saveFailed);
    }
  });
  const name = customerNameOf(customer);
  const trail = [
    { label: customersFr.list.title, to: "/clients" },
    { label: name },
    { label: text.siteTitle },
  ] as const;
  return (
    <FormProvider {...form}>
      <FormShell
        title={text.siteTitle}
        note={text.siteNote}
        trail={trail}
        primaryLabel={text.saveSite}
        isSubmitting={form.formState.isSubmitting}
        onSubmit={submit}
        onCancel={backToFile}
      >
        <Fieldset title={text.addressSection} text={name}>
          <SiteFields hasSiteDetails />
        </Fieldset>
      </FormShell>
    </FormProvider>
  );
};

export const NewSiteScreen = ({ customerId }: { readonly customerId: string }) => {
  const file = useCustomerFile(customerId);
  if (file === undefined) {
    return (
      <div className="mx-auto w-full max-w-[600px] p-4 lg:py-8">
        <FormSkeleton />
      </div>
    );
  }
  return file === null ? <CustomerNotFound /> : <NewSiteForm customer={file.customer} />;
};
