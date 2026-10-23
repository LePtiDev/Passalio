import { X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { DesktopTopBar, type BreadcrumbStep } from "@/components/app-shell/page-bars";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { customersFr } from "../../fr";
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "../customer-styles";
import { SyncPill } from "../sync-indicator";

type FormShellProps = {
  readonly title: string;
  readonly note: string;
  readonly trail: readonly BreadcrumbStep[];
  readonly primaryLabel: string;
  readonly isSubmitting: boolean;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onCancel: () => void;
  readonly children: ReactNode;
};

const text = customersFr.form;

export const FormShell = ({
  title,
  note,
  trail,
  primaryLabel,
  isSubmitting,
  onSubmit,
  onCancel,
  children,
}: FormShellProps) => (
  <form
    noValidate
    onSubmit={onSubmit}
    className="flex min-h-dvh flex-1 flex-col bg-white pb-[100px] lg:pb-0"
  >
    <DesktopTopBar trail={trail}>
      <SyncPill />
    </DesktopTopBar>
    <header className="sticky top-0 z-10 flex min-h-16 items-center gap-2 border-b border-[#E3E8EF] bg-white px-3 py-2 lg:hidden">
      <button
        type="button"
        onClick={onCancel}
        aria-label={text.close}
        className="-ml-1 flex size-12 shrink-0 items-center justify-center rounded-xl"
      >
        <X aria-hidden="true" className="size-[22px]" />
      </button>
      <h1 className="flex-1 text-[17px] font-bold">{title}</h1>
    </header>
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-7 p-4 lg:py-8">
      <div className="hidden flex-col gap-1 lg:flex">
        <h1 className="text-xl font-bold tracking-[-0.015em]">{title}</h1>
        <p className="text-[13px] text-[#475569]">{note}</p>
      </div>
      {children}
    </div>
    <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-[#E3E8EF] bg-white px-4 pt-3 pb-[max(18px,env(safe-area-inset-bottom))] lg:sticky lg:mt-auto lg:flex-row lg:items-center lg:justify-end lg:px-6 lg:py-3">
      <span className="hidden flex-1 text-[13px] text-[#64748B] lg:block">{note}</span>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className={cn(SECONDARY_BUTTON_CLASS, "hidden lg:inline-flex")}
      >
        {text.cancel}
      </Button>
      <Button type="submit" disabled={isSubmitting} className={cn(PRIMARY_BUTTON_CLASS, "lg:px-4")}>
        {primaryLabel}
      </Button>
    </div>
  </form>
);

export const Fieldset = ({
  title,
  text: subtitle,
  className,
  children,
}: {
  readonly title: string;
  readonly text?: string | undefined;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}) => (
  <section className={cn("flex flex-col gap-4", className)}>
    <div className="flex flex-col gap-0.5">
      <h2 className="text-[15px] font-bold lg:text-sm">{title}</h2>
      {subtitle === undefined ? null : <p className="text-[13px] text-[#64748B]">{subtitle}</p>}
    </div>
    {children}
  </section>
);

export const FieldRow = ({ children }: { readonly children: ReactNode }) => (
  <div className="grid gap-4 lg:grid-cols-2">{children}</div>
);
