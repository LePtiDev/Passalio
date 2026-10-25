import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { succeeds } from "@/lib/succeeds";
import {
  companySettingsChanges,
  companySettingsOf,
  companySettingsSchema,
  type CompanySettingsValues,
} from "../../company-settings-form";
import type { DocumentSettings } from "../../document-settings-api";
import { useUpdateSettings } from "../../hooks/use-document-settings";
import { useSettingsData } from "../../hooks/use-settings-data";
import type { OrganizationProfile } from "../../identity-api";
import { CompanyFields } from "./company-fields";
import { FieldErrorsSummary } from "./settings-layout";
import { SettingsError } from "./settings-page";

type CompanyLegalFormProps = {
  readonly submitLabel: string;
  readonly laterLabel: string;
  readonly onLater: () => void;
  readonly onSaved: () => void;
};

const LegalForm = ({
  organization,
  settings,
  submitLabel,
  laterLabel,
  onLater,
  onSaved,
}: CompanyLegalFormProps & {
  readonly organization: OrganizationProfile;
  readonly settings: DocumentSettings;
}) => {
  const form = useForm<CompanySettingsValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: companySettingsOf(organization, settings),
  });
  const update = useUpdateSettings();
  const { errors, isSubmitting } = form.formState;
  const submit = form.handleSubmit(async (values) => {
    if (await succeeds(update.mutateAsync(companySettingsChanges(values)))) {
      onSaved();
    }
  });
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 lg:px-6">
          <CompanyFields canEdit />
          <FieldErrorsSummary count={Object.keys(errors).length} error={update.error} />
        </div>
        <div className="flex flex-col gap-2 border-t border-[#E3E8EF] bg-white px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] lg:flex-row lg:justify-end lg:px-6">
          <Button type="button" variant="secondary" onClick={onLater}>
            {laterLabel}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export const CompanyLegalForm = (props: CompanyLegalFormProps) => {
  const { data, isError, error, retry } = useSettingsData();
  if (data === undefined) {
    return isError ? (
      <SettingsError error={error} onRetry={retry} />
    ) : (
      <div aria-busy="true" className="grid gap-4 px-4 py-4 lg:grid-cols-2 lg:px-6">
        {["name", "form", "siret", "capital", "registry", "address"].map((key) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full lg:h-8" />
          </div>
        ))}
      </div>
    );
  }
  return <LegalForm organization={data.organization} settings={data.settings} {...props} />;
};
