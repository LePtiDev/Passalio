import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { fr } from "@/fr";
import { cn } from "@/lib/utils";
import { backofficeFr } from "../../fr";

type AdminPath = "/admin" | "/admin/comptes" | "/admin/entreprises" | "/admin/contacts";

export type AdminTrailStep = {
  readonly label: string;
  readonly to?: AdminPath;
};

type AdminSection = "platform" | "commercial";

type AdminPageProps = {
  readonly trail: readonly AdminTrailStep[];
  readonly section?: AdminSection;
  readonly mobileTitle: string;
  readonly mobileSubtitle?: string | undefined;
  readonly mobileBack?: { readonly to: AdminPath; readonly label: string };
  readonly mobileAction?: ReactNode;
  readonly children: ReactNode;
};

const SECTION_STEPS: Readonly<Record<AdminSection, AdminTrailStep>> = {
  platform: { label: backofficeFr.shell.platform },
  commercial: { label: backofficeFr.shell.commercial },
};

export const AdminPage = ({
  trail,
  section = "platform",
  mobileTitle,
  mobileSubtitle,
  mobileBack,
  mobileAction,
  children,
}: AdminPageProps) => {
  const steps = trail[0]?.to === undefined ? [SECTION_STEPS[section], ...trail] : trail;
  return (
    <>
      <nav
        aria-label={fr.shell.breadcrumb}
        className="hidden h-11 shrink-0 items-center border-b border-[#E3E8EF] px-6 text-[13px] text-[#64748B] lg:flex"
      >
        <ol className="flex min-w-0 items-center gap-2">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <li key={step.label} className="flex min-w-0 items-center gap-2">
                {isLast || step.to === undefined ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? "truncate font-semibold text-[#0F2A44]" : undefined}
                  >
                    {step.label}
                  </span>
                ) : (
                  <Link to={step.to} className="hover:text-[#0F2A44]">
                    {step.label}
                  </Link>
                )}
                {isLast ? null : <span aria-hidden="true">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-2 border-b border-[#E3E8EF] bg-white px-4 py-2 lg:hidden">
        {mobileBack === undefined ? null : (
          <Link
            to={mobileBack.to}
            aria-label={mobileBack.label}
            className="-ml-2 flex size-12 shrink-0 items-center justify-center rounded-xl"
          >
            <ChevronLeft aria-hidden="true" className="size-[22px]" />
          </Link>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-[17px] font-bold">{mobileTitle}</h1>
          {mobileSubtitle === undefined ? null : (
            <span className="truncate text-[13px] text-[#64748B]">{mobileSubtitle}</span>
          )}
        </span>
        {mobileAction}
      </header>
      <div
        className={cn(
          "flex w-full min-w-0 flex-col gap-4 p-4 lg:gap-5 lg:p-6",
          section === "commercial" && "flex-1 bg-white leading-[1.26]",
        )}
      >
        {children}
      </div>
    </>
  );
};

export const AdminHeading = ({
  title,
  subtitle,
  children,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly children?: ReactNode;
}) => (
  <div className="hidden flex-wrap items-end justify-between gap-4 lg:flex">
    <div className="flex flex-col gap-1">
      <h1 className="text-xl leading-tight font-bold tracking-[-0.015em]">{title}</h1>
      <p className="text-[13px] text-[#475569]">{subtitle}</p>
    </div>
    {children}
  </div>
);
