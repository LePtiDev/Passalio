import { zodResolver } from "@hookform/resolvers/zod";
import type { BrandColor, DocumentTemplate } from "@passalio/shared";
import { useCallback, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { apiErrorOf } from "@/lib/api-client";
import { certificatePreviewOf } from "../../certificate-preview-of";
import { changeCount, changedSettings } from "../../changed-settings";
import type { DocumentSettings } from "../../document-settings-api";
import {
  documentSettingsChanges,
  documentSettingsOf,
  documentSettingsSchema,
  type DocumentSettingsValues,
} from "../../document-settings-form";
import { useCertificatePreview, usePdfLogo } from "../../hooks/use-certificate-preview";
import { useDocumentValues } from "../../hooks/use-document-values";
import { useUpdateSettings } from "../../hooks/use-document-settings";
import { useLogoRevision } from "../../hooks/use-logo-revision";
import { useSettingsData } from "../../hooks/use-settings-data";
import type { OrganizationProfile } from "../../identity-api";
import { settingsFr } from "../../settings-fr";
import { CertificatePreviewPanel } from "./certificate-preview-panel";
import { AdviceNote, ContactFields, NumberingFields, TextsFields } from "./document-fields";
import { LogoAndColor } from "./logo-and-color";
import { PreviewSheet } from "./preview-sheet";
import { SettingsHeading, SettingsPage } from "./settings-page";
import {
  FieldErrorsSummary,
  SaveBar,
  SettingsAside,
  SettingsCard,
  SettingsColumns,
  SettingsMain,
} from "./settings-layout";
import { TemplateChoice } from "./template-choice";

const text = settingsFr.documents;

type DocumentFormProps = {
  readonly organization: OrganizationProfile;
  readonly settings: DocumentSettings;
  readonly canEdit: boolean;
};

const DocumentForm = ({ organization, settings, canEdit }: DocumentFormProps) => {
  const [baseline, setBaseline] = useState(() => documentSettingsOf(organization, settings));
  const form = useForm<DocumentSettingsValues>({
    resolver: zodResolver(documentSettingsSchema),
    defaultValues: baseline,
  });
  const update = useUpdateSettings();
  const values = useDocumentValues(form.control);
  const logo = useLogoRevision(organization.hasLogo);
  const pdfLogo = usePdfLogo(logo.version);
  const { preview, isSampleCompany } = useMemo(
    () => certificatePreviewOf({ organization, settings, values, logo: pdfLogo.data ?? null }),
    [organization, settings, values, pdfLogo.data],
  );
  const previewState = useCertificatePreview(preview);
  const pending = changeCount(documentSettingsChanges(baseline), documentSettingsChanges(values));
  const { errors, isSubmitting } = form.formState;
  const submit = form.handleSubmit(async (submitted) => {
    const changes = changedSettings(
      documentSettingsChanges(baseline),
      documentSettingsChanges(submitted),
    );
    const error = await update.mutateAsync(changes).then(() => null, apiErrorOf);
    if (error === null) {
      setBaseline(submitted);
      form.reset(submitted);
      toast.success(settingsFr.saved);
    } else if (error.code === "document_number_already_used") {
      form.setError("nextDocumentNumber", { message: text.errors.numberAlreadyUsed });
    }
  });
  const cancel = useCallback(() => {
    update.reset();
    form.reset(baseline);
  }, [form, baseline, update]);
  const chooseTemplate = useCallback(
    (template: DocumentTemplate) => form.setValue("documentTemplate", template),
    [form],
  );
  const chooseColor = useCallback(
    (color: BrandColor) => form.setValue("brandColor", color),
    [form],
  );
  const panel = <CertificatePreviewPanel state={previewState} isSampleCompany={isSampleCompany} />;
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={submit} className="flex flex-1 flex-col">
        <SettingsColumns>
          <SettingsMain>
            <SettingsHeading title={text.title} intro={text.intro} />
            <SettingsCard title={text.template}>
              <TemplateChoice
                value={values.documentTemplate}
                brandColor={values.brandColor}
                isDisabled={!canEdit}
                onChange={chooseTemplate}
              />
            </SettingsCard>
            <SettingsCard title={text.logoAndColor}>
              <LogoAndColor
                name={organization.name}
                logoUrl={logo.url}
                brandColor={values.brandColor}
                isDisabled={!canEdit}
                onLogoChanged={logo.refresh}
                onColorChange={chooseColor}
              />
            </SettingsCard>
            <fieldset disabled={!canEdit} className="flex min-w-0 flex-col gap-4">
              <ContactFields />
              <TextsFields />
              <AdviceNote />
              <NumberingFields hasReservedNumbers={settings.hasReservedNumbers} />
            </fieldset>
            {canEdit ? null : <p className="text-[13px] text-[#64748B]">{settingsFr.readOnly}</p>}
            <FieldErrorsSummary count={Object.keys(errors).length} error={update.error} />
          </SettingsMain>
          <SettingsAside>{panel}</SettingsAside>
        </SettingsColumns>
        {canEdit ? (
          <SaveBar changeCount={pending} isSaving={isSubmitting} onCancel={cancel}>
            <PreviewSheet>{panel}</PreviewSheet>
          </SaveBar>
        ) : (
          <div className="p-4 lg:hidden">{panel}</div>
        )}
      </form>
    </FormProvider>
  );
};

export const DocumentSettingsScreen = () => {
  const { data, isError, error, retry, canEdit } = useSettingsData();
  return (
    <SettingsPage
      title={text.title}
      state={data === undefined ? (isError ? "error" : "loading") : "ready"}
      error={error}
      onRetry={retry}
    >
      {data === undefined ? null : (
        <DocumentForm organization={data.organization} settings={data.settings} canEdit={canEdit} />
      )}
    </SettingsPage>
  );
};
