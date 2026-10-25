import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useMemo, type FormEvent, type ReactNode } from "react";
import { DesktopTopBar, type BreadcrumbStep } from "@/components/app-shell/page-bars";
import { SyncPill } from "@/contexts/customers";
import { cn } from "@/lib/utils";
import { complianceFr } from "../fr";

const STEP_COUNT = 2;

type CertificatePageProps = {
  readonly interventionId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly desktopSubtitle: string;
  readonly trail: readonly BreadcrumbStep[];
  readonly stepLabel: string;
  readonly step: 1 | 2;
  readonly note: string;
  readonly actions: ReactNode;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly children: ReactNode;
};

const StepBar = ({ label, step }: { readonly label: string; readonly step: number }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="truncate font-semibold">{label}</span>
      <span className="shrink-0 text-[#64748B]">{complianceFr.form.step(step, STEP_COUNT)}</span>
    </div>
    <div className="flex gap-1" aria-hidden="true">
      {Array.from({ length: STEP_COUNT }, (_, index) => (
        <span
          key={`step-${index + 1}`}
          className={cn("h-1 flex-1 rounded-full bg-[#E3E8EF]", index < step && "bg-[#0E7C5A]")}
        />
      ))}
    </div>
  </div>
);

const BackLink = ({ interventionId }: { readonly interventionId: string }) => {
  const params = useMemo(() => ({ interventionId }), [interventionId]);
  return (
    <Link
      to="/passages/$interventionId"
      params={params}
      aria-label={complianceFr.form.back}
      className="-ml-1 flex size-12 shrink-0 items-center justify-center rounded-xl"
    >
      <ChevronLeft aria-hidden="true" className="size-[22px]" />
    </Link>
  );
};

export const CertificatePage = ({
  interventionId,
  title,
  subtitle,
  desktopSubtitle,
  trail,
  stepLabel,
  step,
  note,
  actions,
  onSubmit,
  children,
}: CertificatePageProps) => (
  <form
    noValidate
    onSubmit={onSubmit}
    className="flex min-h-dvh flex-1 flex-col bg-white pb-[100px] lg:pb-0"
  >
    <DesktopTopBar trail={trail}>
      <SyncPill />
    </DesktopTopBar>
    <header className="sticky top-0 z-10 flex min-h-16 items-center gap-2 border-b border-[#E3E8EF] bg-white px-3 py-2 lg:hidden">
      <BackLink interventionId={interventionId} />
      <span className="flex min-w-0 flex-col">
        <h1 className="truncate text-[17px] font-bold">{title}</h1>
        <span className="truncate text-[13px] text-[#64748B]">{subtitle}</span>
      </span>
    </header>
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-7 p-4 lg:max-w-[800px] lg:py-8">
      <div className="hidden flex-col gap-1 lg:flex">
        <h1 className="text-xl font-bold tracking-[-0.015em]">{title}</h1>
        <p className="text-[13px] text-[#475569]">{desktopSubtitle}</p>
      </div>
      <StepBar label={stepLabel} step={step} />
      {children}
    </div>
    <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-[#E3E8EF] bg-white px-4 pt-3 pb-[max(18px,env(safe-area-inset-bottom))] lg:sticky lg:mt-auto lg:flex-row lg:items-center lg:justify-end lg:px-6 lg:py-3">
      <span className="hidden flex-1 text-[13px] text-[#64748B] lg:block">{note}</span>
      {actions}
    </div>
  </form>
);
