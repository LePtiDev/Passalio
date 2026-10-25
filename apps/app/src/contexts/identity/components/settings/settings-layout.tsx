import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { apiErrorOf } from "@/lib/api-client";
import { errorCodeLine, errorMessage } from "@/lib/errors";
import { settingsFr } from "../../settings-fr";

export const SETTINGS_CARD_CLASS =
  "flex flex-col gap-4 rounded-[14px] border border-[#E3E8EF] bg-white p-4 lg:rounded-xl";

export const SettingsCard = ({
  title,
  subtitle,
  children,
}: {
  readonly title: string;
  readonly subtitle?: string | undefined;
  readonly children: ReactNode;
}) => (
  <section className={SETTINGS_CARD_CLASS}>
    <div className="flex flex-col gap-0.5">
      <h2 className="text-[15px] font-bold lg:text-sm">{title}</h2>
      {subtitle === undefined ? null : <p className="text-[13px] text-[#64748B]">{subtitle}</p>}
    </div>
    {children}
  </section>
);

export const SettingsColumns = ({ children }: { readonly children: ReactNode }) => (
  <div className="flex flex-1 flex-col lg:flex-row">{children}</div>
);

export const SettingsMain = ({ children }: { readonly children: ReactNode }) => (
  <div className="flex w-full flex-col gap-4 bg-[#F7F9FB] p-4 pb-32 lg:max-w-[600px] lg:bg-white lg:p-6 lg:pb-24">
    {children}
  </div>
);

export const SettingsAside = ({ children }: { readonly children: ReactNode }) => (
  <aside className="hidden flex-1 flex-col gap-4 border-l border-[#E3E8EF] bg-[#F7F9FB] p-6 pb-24 lg:flex">
    {children}
  </aside>
);

type SaveBarProps = {
  readonly changeCount: number;
  readonly note?: string | undefined;
  readonly isSaving: boolean;
  readonly onCancel: () => void;
  readonly children?: ReactNode;
};

export const SaveBar = ({ changeCount, note, isSaving, onCancel, children }: SaveBarProps) => (
  <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 flex items-center gap-2 border-t border-[#E3E8EF] bg-white px-4 py-3 lg:sticky lg:bottom-0 lg:mt-auto lg:px-6">
    <span className="hidden flex-1 text-[13px] text-[#64748B] lg:block" aria-live="polite">
      {changeCount === 0 ? note : settingsFr.unsavedChanges(changeCount)}
    </span>
    {children === undefined ? null : <span className="flex flex-1 lg:hidden">{children}</span>}
    <Button
      type="button"
      variant="secondary"
      onClick={onCancel}
      disabled={changeCount === 0 || isSaving}
      className="hidden lg:inline-flex"
    >
      {settingsFr.cancel}
    </Button>
    <Button type="submit" disabled={isSaving} className="flex-1 lg:flex-none">
      {isSaving ? settingsFr.saving : settingsFr.save}
    </Button>
  </div>
);

export const FieldErrorsSummary = ({
  count,
  error,
}: {
  readonly count: number;
  readonly error: unknown;
}) => {
  if (count === 0 && error === null) {
    return null;
  }
  const apiError = error === null ? null : apiErrorOf(error);
  const codeLine = apiError === null ? undefined : errorCodeLine(apiError);
  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-destructive lg:text-[13px]">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        {apiError === null ? settingsFr.fieldsToFix(count) : errorMessage(apiError.code)}
        {codeLine === undefined ? null : ` ${codeLine}`}
      </span>
    </p>
  );
};
