import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { fr } from "@/fr";

export type BreadcrumbStep = {
  readonly label: string;
  readonly to?: "/" | "/reglages" | "/equipe";
};

export const DesktopTopBar = ({ trail }: { readonly trail: readonly BreadcrumbStep[] }) => (
  <nav
    aria-label={fr.shell.breadcrumb}
    className="hidden h-11 shrink-0 items-center border-b border-[#E3E8EF] px-6 text-[13px] text-[#64748B] lg:flex"
  >
    <ol className="flex items-center gap-2">
      {trail.map((step, index) => {
        const isLast = index === trail.length - 1;
        return (
          <li key={step.label} className="flex items-center gap-2">
            {isLast || step.to === undefined ? (
              <span
                aria-current={isLast ? "page" : undefined}
                className={isLast ? "font-semibold text-[#0F2A44]" : undefined}
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
);

type MobileTopBarProps = {
  readonly backTo?: "/reglages";
  readonly backLabel?: string;
  readonly children: ReactNode;
};

export const MobileTopBar = ({ backTo, backLabel, children }: MobileTopBarProps) => (
  <header className="sticky top-0 z-10 flex min-h-16 items-center gap-2 border-b border-[#E3E8EF] bg-white px-3 py-2 lg:hidden">
    {backTo === undefined ? null : (
      <Link
        to={backTo}
        aria-label={backLabel}
        className="-ml-1 flex size-12 shrink-0 items-center justify-center rounded-xl"
      >
        <ChevronLeft aria-hidden="true" className="size-[22px]" />
      </Link>
    )}
    {children}
  </header>
);

export const PageContent = ({ children }: { readonly children: ReactNode }) => (
  <div className="flex w-full flex-col gap-4 p-4 lg:gap-5 lg:p-6">{children}</div>
);
