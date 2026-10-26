import { MAIL_PROVIDERS, type MailProvider, type MailSettingsResponse } from "@passalio/shared";
import { Check } from "lucide-react";
import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { apiErrorOf } from "@/lib/api-client";
import { errorCodeLine, errorMessage } from "@/lib/errors";
import { whenLabel } from "../../call-time-labels";
import { shortDayLabel } from "../../date-labels";
import { configurationFr } from "../../fr-configuration";
import { ConfigurationSelectField, ConfigurationTextField } from "./configuration-fields";
import {
  PORT_CHOICES,
  portChoiceOf,
  presetOf,
  type ConfigurationFormValues,
} from "./configuration-form-schema";
import { ConfigurationGrid, ConfigurationSection } from "./configuration-section";

const sender = configurationFr.sender;
const connection = configurationFr.connection;

const PROVIDER_OPTIONS = MAIL_PROVIDERS.map((provider) => ({
  value: provider,
  label: configurationFr.providers[provider],
}));

const PORT_OPTIONS = PORT_CHOICES.map((port) => ({
  value: port,
  label: configurationFr.ports[port === "465" ? 465 : 587],
}));

const APP_PASSWORD_PAGES: Partial<Record<MailProvider, { url: string; label: string }>> = {
  zoho: {
    url: "https://accounts.zoho.eu/home#security/app_password",
    label: connection.appPassword.zoho,
  },
  google: {
    url: "https://myaccount.google.com/apppasswords",
    label: connection.appPassword.google,
  },
};

type SavedSettings = MailSettingsResponse["settings"];

export type MailboxTest = {
  readonly isPending: boolean;
  readonly error: unknown;
  readonly run: () => void;
};

const SenderSection = () => {
  const { setValue } = useFormContext<ConfigurationFormValues>();
  const fillPreset = useCallback(
    (provider: MailProvider) => {
      const preset = presetOf(provider);
      if (preset !== null) {
        setValue("smtpHost", preset.host, { shouldDirty: true, shouldValidate: true });
        setValue("smtpPort", portChoiceOf(preset.port), { shouldDirty: true });
      }
    },
    [setValue],
  );
  return (
    <ConfigurationSection title={sender.title} hint={sender.hint}>
      <ConfigurationGrid>
        <ConfigurationTextField name="senderName" label={sender.senderName} isRequired />
        <ConfigurationTextField
          name="senderAddress"
          label={sender.senderAddress}
          type="email"
          isRequired
        />
        <ConfigurationSelectField
          name="provider"
          label={sender.provider}
          options={PROVIDER_OPTIONS}
          hint={sender.providerHint}
          onChosen={fillPreset}
        />
        <ConfigurationTextField
          name="replyTo"
          label={sender.replyTo}
          type="email"
          hint={sender.replyToHint}
        />
      </ConfigurationGrid>
    </ConfigurationSection>
  );
};

const TestStatus = ({
  settings,
  isDirty,
  test,
  now,
}: {
  readonly settings: SavedSettings;
  readonly isDirty: boolean;
  readonly test: MailboxTest;
  readonly now: Date;
}) => {
  if (settings === null || isDirty) {
    return <span className="text-sm text-[#64748B] lg:text-[13px]">{connection.saveFirst}</span>;
  }
  if (test.error !== null && !test.isPending) {
    const apiError = apiErrorOf(test.error);
    const codeLine = errorCodeLine(apiError);
    return (
      <span role="alert" className="flex flex-col text-sm text-destructive lg:text-[13px]">
        <span className="font-semibold">{errorMessage(apiError.code)}</span>
        {codeLine === undefined ? null : <span className="tabular-nums">{codeLine}</span>}
      </span>
    );
  }
  if (settings.verifiedAt === null) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B6B4E] lg:text-[13px]">
      <Check aria-hidden="true" className="size-4 shrink-0 text-[#0E7C5A]" strokeWidth={2.4} />
      {connection.verified(whenLabel(new Date(settings.verifiedAt), now))}
    </span>
  );
};

const ConnectionSection = ({
  settings,
  test,
  now,
}: {
  readonly settings: SavedSettings;
  readonly test: MailboxTest;
  readonly now: Date;
}) => {
  const { control, formState } = useFormContext<ConfigurationFormValues>();
  const provider = useWatch({ control, name: "provider" });
  const appPassword = APP_PASSWORD_PAGES[provider];
  const hasPassword = settings?.hasPassword === true;
  const passwordHint =
    settings !== null && settings.passwordUpdatedAt !== null
      ? connection.passwordSaved(shortDayLabel(settings.passwordUpdatedAt, now))
      : connection.passwordHint;
  const canTest = settings !== null && !formState.isDirty && !test.isPending;
  return (
    <ConfigurationSection title={connection.title} hint={connection.hint}>
      <ConfigurationGrid>
        <ConfigurationTextField name="smtpHost" label={connection.host} isRequired />
        <ConfigurationSelectField name="smtpPort" label={connection.port} options={PORT_OPTIONS} />
        <ConfigurationTextField name="smtpUsername" label={connection.username} isRequired />
        <ConfigurationTextField
          name="smtpPassword"
          label={connection.password}
          type="password"
          autoComplete="new-password"
          isRequired={!hasPassword}
          hint={passwordHint}
        />
      </ConfigurationGrid>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <Button type="button" variant="secondary" disabled={!canTest} onClick={test.run}>
          {test.isPending ? connection.testing : connection.test}
        </Button>
        <TestStatus settings={settings} isDirty={formState.isDirty} test={test} now={now} />
        {appPassword === undefined ? null : (
          <a
            href={appPassword.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center text-sm font-semibold text-[#0E7C5A] hover:text-[#0B6349] lg:ml-auto lg:min-h-8 lg:text-[13px]"
          >
            {appPassword.label}
          </a>
        )}
      </div>
    </ConfigurationSection>
  );
};

export const MailboxSections = ({
  settings,
  test,
  now,
}: {
  readonly settings: SavedSettings;
  readonly test: MailboxTest;
  readonly now: Date;
}) => (
  <>
    <SenderSection />
    <ConnectionSection settings={settings} test={test} now={now} />
  </>
);
