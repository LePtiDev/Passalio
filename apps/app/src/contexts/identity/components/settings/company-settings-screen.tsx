import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { FormProvider, useForm, useWatch, type Control } from "react-hook-form";
import { toast } from "sonner";
import { succeeds } from "@/lib/succeeds";
import { changeCount, changedSettings } from "../../changed-settings";
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
import { settingsFr } from "../../settings-fr";
import { CompanyFields } from "./company-fields";
import { LegalLinePreview, MissingMentionsBanner } from "./legal-line-preview";
import { SettingsHeading, SettingsPage } from "./settings-page";
import {
  FieldErrorsSummary,
  SaveBar,
  SettingsAside,
  SettingsCard,
  SettingsColumns,
  SettingsMain,
} from "./settings-layout";

const text = settingsFr.company;

type CompanyFormProps = {
  readonly organization: OrganizationProfile;
  readonly settings: DocumentSettings;
  readonly canEdit: boolean;
};

const useCompanyValues = (control: Control<CompanySettingsValues>): CompanySettingsValues => {
  const [name, legalForm, siret, shareCapital, registryKind, registryCity, apeCode, address] =
    useWatch({
      control,
      name: [
        "name",
        "legalForm",
        "siret",
        "shareCapital",
        "registryKind",
        "registryCity",
        "apeCode",
        "address",
      ],
    });
  return { name, legalForm, siret, shareCapital, registryKind, registryCity, apeCode, address };
};

const CompanyForm = ({ organization, settings, canEdit }: CompanyFormProps) => {
  const [baseline, setBaseline] = useState(() => companySettingsOf(organization, settings));
  const form = useForm<CompanySettingsValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: baseline,
  });
  const update = useUpdateSettings();
  const values = useCompanyValues(form.control);
  const pending = changeCount(companySettingsChanges(baseline), companySettingsChanges(values));
  const { errors, isSubmitting } = form.formState;
  const submit = form.handleSubmit(async (submitted) => {
    const changes = changedSettings(
      companySettingsChanges(baseline),
      companySettingsChanges(submitted),
    );
    if (await succeeds(update.mutateAsync(changes))) {
      setBaseline(submitted);
      form.reset(submitted);
      toast.success(settingsFr.saved);
    }
  });
  const cancel = useCallback(() => {
    update.reset();
    form.reset(baseline);
  }, [form, baseline, update]);
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={submit} className="flex flex-1 flex-col">
        <SettingsColumns>
          <SettingsMain>
            <SettingsHeading title={text.title} intro={text.intro} />
            <MissingMentionsBanner mentions={settings.missingLegalMentions} />
            <SettingsCard title={text.legalIdentity}>
              <CompanyFields canEdit={canEdit} />
            </SettingsCard>
            {canEdit ? null : <p className="text-[13px] text-[#64748B]">{settingsFr.readOnly}</p>}
            <FieldErrorsSummary count={Object.keys(errors).length} error={update.error} />
            <div className="lg:hidden">
              <LegalLinePreview draft={values} />
            </div>
          </SettingsMain>
          <SettingsAside>
            <LegalLinePreview draft={values} />
          </SettingsAside>
        </SettingsColumns>
        {canEdit ? (
          <SaveBar changeCount={pending} isSaving={isSubmitting} onCancel={cancel} />
        ) : null}
      </form>
    </FormProvider>
  );
};

export const CompanySettingsScreen = () => {
  const { data, isError, error, retry, canEdit } = useSettingsData();
  return (
    <SettingsPage
      title={text.title}
      state={data === undefined ? (isError ? "error" : "loading") : "ready"}
      error={error}
      onRetry={retry}
    >
      {data === undefined ? null : (
        <CompanyForm organization={data.organization} settings={data.settings} canEdit={canEdit} />
      )}
    </SettingsPage>
  );
};
