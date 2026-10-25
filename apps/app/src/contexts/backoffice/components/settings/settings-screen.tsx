import { useCallback, useMemo, useState } from "react";
import { ErrorState } from "@/components/error-state";
import { useChangeSignUpSettings, useSignUpSettings } from "../../hooks/use-sign-up-settings";
import { platformEnvironmentOf } from "../../platform-environment";
import { ENVIRONMENT_LABELS, settingsFr } from "../../settings-fr";
import { AdminHeading, AdminPage, type AdminTrailStep } from "../shell/admin-page";
import { CloseSignUpDialog } from "./close-sign-up-dialog";
import { SettingsSkeleton } from "./settings-skeleton";
import { SignUpSettingsCard } from "./sign-up-settings-card";

const TRAIL: readonly AdminTrailStep[] = [{ label: settingsFr.title }];

const MOBILE_BACK = { to: "/admin", label: settingsFr.back } as const;

const ENVIRONMENT_BADGE_CLASS =
  "rounded-md bg-[#EEF3F8] px-2 py-1 text-xs font-semibold text-[#334155]";

type SettingsScreenProps = {
  readonly hostname?: string;
  readonly host?: string;
};

export const SettingsScreen = ({
  hostname = window.location.hostname,
  host = window.location.host,
}: SettingsScreenProps) => {
  const settings = useSignUpSettings();
  const change = useChangeSignUpSettings();
  const [isConfirming, setIsConfirming] = useState(false);
  const environment = ENVIRONMENT_LABELS[platformEnvironmentOf(hostname)];
  const { refetch } = settings;
  const { mutate } = change;
  const retry = useCallback(() => void refetch(), [refetch]);
  const toggle = useCallback(
    (isSignUpOpen: boolean) => {
      if (isSignUpOpen) {
        mutate(true);
        return;
      }
      setIsConfirming(true);
    },
    [mutate],
  );
  const confirmClose = useCallback(() => {
    setIsConfirming(false);
    mutate(false);
  }, [mutate]);
  const cancelClose = useCallback(() => setIsConfirming(false), []);
  const environmentBadge = useMemo(
    () => <span className={ENVIRONMENT_BADGE_CLASS}>{environment}</span>,
    [environment],
  );
  return (
    <AdminPage
      trail={TRAIL}
      mobileTitle={settingsFr.title}
      mobileBack={MOBILE_BACK}
      mobileAction={environmentBadge}
    >
      <div className="flex w-full max-w-3xl flex-col gap-4 lg:gap-5">
        <div className="hidden items-start justify-between gap-4 lg:flex">
          <AdminHeading title={settingsFr.title} subtitle={settingsFr.subtitle} />
          {environmentBadge}
        </div>
        {settings.isPending ? <SettingsSkeleton /> : null}
        {settings.isError ? (
          <ErrorState error={settings.error} onRetry={retry} message={settingsFr.loadError} />
        ) : null}
        {settings.isSuccess ? (
          <>
            <SignUpSettingsCard
              settings={settings.data.settings}
              host={host}
              isChanging={change.isPending}
              onToggle={toggle}
            />
            <p className="text-[13px] text-[#64748B]">
              <span className="hidden lg:inline">{settingsFr.journalHint}</span>
              <span className="lg:hidden">{settingsFr.journalHintShort}</span>
            </p>
          </>
        ) : null}
      </div>
      {isConfirming ? (
        <CloseSignUpDialog
          environment={environment}
          host={host}
          onConfirm={confirmClose}
          onClose={cancelClose}
        />
      ) : null}
    </AdminPage>
  );
};
