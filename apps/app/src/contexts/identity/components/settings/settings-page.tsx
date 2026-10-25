import { CircleAlert, RefreshCw } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { DesktopTopBar, MobileTopBar, type BreadcrumbStep } from "@/components/app-shell/page-bars";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorOf } from "@/lib/api-client";
import { errorCodeLine } from "@/lib/errors";
import { fr } from "@/fr";
import { settingsFr } from "../../settings-fr";
import { SETTINGS_CARD_CLASS } from "./settings-layout";

const SKELETON_CARDS = ["first", "second", "third"] as const;

const SettingsSkeleton = () => (
  <div
    aria-busy="true"
    aria-label={settingsFr.loading}
    className="flex w-full flex-col gap-4 p-4 lg:max-w-[600px] lg:p-6"
  >
    <Skeleton className="h-5 w-4/5" />
    <Skeleton className="h-4 w-3/5" />
    {SKELETON_CARDS.map((card) => (
      <div key={card} className={SETTINGS_CARD_CLASS}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full lg:h-8" />
        <Skeleton className="h-12 w-full lg:h-8" />
      </div>
    ))}
  </div>
);

const SettingsError = ({
  error,
  onRetry,
}: {
  readonly error: unknown;
  readonly onRetry: () => void;
}) => {
  const codeLine = errorCodeLine(apiErrorOf(error));
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center lg:max-w-[600px]"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-[#FDEDEC]">
        <CircleAlert aria-hidden="true" className="size-6 text-destructive" />
      </span>
      <span className="text-[17px] font-bold">{settingsFr.loadFailed}</span>
      <span className="text-[15px] text-[#475569] lg:text-sm">{settingsFr.loadFailedText}</span>
      {codeLine === undefined ? null : (
        <span className="text-[13px] text-[#64748B] tabular-nums">{codeLine}</span>
      )}
      <Button type="button" onClick={onRetry} className="w-full lg:w-auto">
        <RefreshCw aria-hidden="true" className="size-4" />
        {fr.errors.retry}
      </Button>
    </div>
  );
};

type SettingsPageProps = {
  readonly title: string;
  readonly state: "loading" | "error" | "ready";
  readonly error: unknown;
  readonly onRetry: () => void;
  readonly children: ReactNode;
};

export const SettingsPage = ({ title, state, error, onRetry, children }: SettingsPageProps) => {
  const trail = useMemo(
    (): readonly BreadcrumbStep[] => [
      { label: settingsFr.settings, to: "/reglages" },
      { label: title },
    ],
    [title],
  );
  return (
    <>
      <DesktopTopBar trail={trail} />
      <MobileTopBar backTo="/reglages" backLabel={settingsFr.backToSettings}>
        <h1 className="flex-1 text-[17px] font-bold">{title}</h1>
      </MobileTopBar>
      {state === "loading" ? <SettingsSkeleton /> : null}
      {state === "error" ? <SettingsError error={error} onRetry={onRetry} /> : null}
      {state === "ready" ? children : null}
    </>
  );
};

export const SettingsHeading = ({
  title,
  intro,
}: {
  readonly title: string;
  readonly intro: string;
}) => (
  <div className="flex flex-col gap-1">
    <h1 className="hidden text-xl font-bold tracking-[-0.015em] lg:block">{title}</h1>
    <p className="text-[15px] text-[#475569] lg:text-[13px]">{intro}</p>
  </div>
);
