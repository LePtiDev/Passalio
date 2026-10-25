import { zodResolver } from "@hookform/resolvers/zod";
import type { MailSettingsResponse, PlatformRole } from "@passalio/shared";
import { useCallback, useMemo, type FormEvent } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { configurationFr } from "../../fr-configuration";
import { useSaveMailSettings, useTestMailbox } from "../../hooks/use-mail-settings";
import {
  configurationFormOf,
  configurationFormSchema,
  firstTabWithError,
  toMailSettingsChange,
  type ConfigurationFormValues,
  type ConfigurationTab,
} from "./configuration-form-schema";
import { MailboxSections, type MailboxTest } from "./mailbox-sections";
import { ProfileSection } from "./profile-section";
import { RemindersSection } from "./reminders-section";
import { SignatureSection } from "./signature-section";

export const CONFIGURATION_FORM_ID = "configuration-form";

type ConfigurationFormProps = {
  readonly response: MailSettingsResponse;
  readonly role: PlatformRole | null;
  readonly tab: ConfigurationTab;
  readonly now: Date;
  readonly onTabChange: (tab: ConfigurationTab) => void;
};

export const ConfigurationForm = ({
  response,
  role,
  tab,
  now,
  onTabChange,
}: ConfigurationFormProps) => {
  const { userId, settings } = response;
  const save = useSaveMailSettings(userId);
  const testMailbox = useTestMailbox(userId);
  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(configurationFormSchema(settings?.hasPassword === true)),
    defaultValues: configurationFormOf(response),
  });
  const { mutate } = save;
  const submit = form.handleSubmit(
    (values) =>
      mutate(toMailSettingsChange(values), {
        onSuccess: () => form.reset({ ...values, smtpPassword: "" }),
      }),
    (errors) => {
      const tabWithError = firstTabWithError(Object.keys(errors));
      if (tabWithError !== null && tabWithError !== tab) {
        onTabChange(tabWithError);
      }
    },
  );
  const onSubmit = useCallback((event: FormEvent<HTMLFormElement>) => void submit(event), [submit]);
  const runTest = useCallback(() => testMailbox.mutate(), [testMailbox]);
  const test = useMemo(
    (): MailboxTest => ({
      isPending: testMailbox.isPending,
      error: testMailbox.error,
      run: runTest,
    }),
    [testMailbox.isPending, testMailbox.error, runTest],
  );
  return (
    <FormProvider {...form}>
      <form
        id={CONFIGURATION_FORM_ID}
        noValidate
        onSubmit={onSubmit}
        className="flex flex-col gap-5"
      >
        {tab === "profil" ? <ProfileSection member={response.member} role={role} /> : null}
        {tab === "boite" ? <MailboxSections settings={settings} test={test} now={now} /> : null}
        {tab === "rappels" ? <RemindersSection /> : null}
        {tab === "signature" ? <SignatureSection /> : null}
        <div className="sticky bottom-[84px] -mx-4 border-t border-[#E3E8EF] bg-white px-4 py-3 lg:hidden">
          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending ? configurationFr.saving : configurationFr.save}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
