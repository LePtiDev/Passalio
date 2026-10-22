import type { ReactNode } from "react";
import logo from "@/assets/passalio-logo.svg";
import { fr } from "@/fr";
import { cn } from "@/lib/utils";
import { onboardingFr } from "../../onboarding-fr";
import { OnboardingSidebar } from "./onboarding-sidebar";
import { ONBOARDING_STEP_COUNT, type OnboardingStep } from "./onboarding-steps";

const STEP_NUMBERS = [1, 2, 3, 4, 5] as const;

const MobileStepHeader = ({ step }: { readonly step: OnboardingStep }) => (
  <header className="flex flex-col gap-3.5 border-b border-[#E3E8EF] bg-white px-5 py-4 lg:hidden">
    <div className="flex items-center justify-between">
      <img src={logo} alt={fr.app.name} width={121} height={24} className="h-6 w-auto" />
      <span className="text-[13px] font-semibold text-muted-foreground">
        {onboardingFr.layout.stepOf(step, ONBOARDING_STEP_COUNT)}
      </span>
    </div>
    <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
      {STEP_NUMBERS.map((number) => (
        <span
          key={number}
          className={cn(
            "h-1 rounded-full",
            number < step && "bg-success",
            number === step && "bg-[var(--brand-navy)]",
            number > step && "bg-[#E3E8EF]",
          )}
        />
      ))}
    </div>
  </header>
);

type OnboardingLayoutProps = {
  readonly step: OnboardingStep;
  readonly children: ReactNode;
};

export const OnboardingLayout = ({ step, children }: OnboardingLayoutProps) => (
  <div className="flex min-h-dvh flex-col bg-[#F7F9FB] lg:flex-row lg:bg-background">
    <MobileStepHeader step={step} />
    <OnboardingSidebar step={step} />
    <main className="flex min-w-0 flex-1 flex-col">{children}</main>
  </div>
);

export type OnboardingWidth = "narrow" | "medium" | "wide";

const WIDTH_CLASS: Readonly<Record<OnboardingWidth, string>> = {
  narrow: "max-w-[520px]",
  medium: "max-w-[620px]",
  wide: "max-w-[900px]",
};

type OnboardingSectionProps = {
  readonly width: OnboardingWidth;
  readonly children: ReactNode;
};

export const OnboardingBody = ({ width, children }: OnboardingSectionProps) => (
  <div className="flex flex-1 justify-center px-5 py-6 lg:px-8 lg:pt-16 lg:pb-8">
    <div className={cn("flex w-full flex-col gap-5 lg:gap-[22px]", WIDTH_CLASS[width])}>
      {children}
    </div>
  </div>
);

export const OnboardingFooter = ({ width, children }: OnboardingSectionProps) => (
  <div className="sticky bottom-0 flex justify-center border-t border-[#E3E8EF] bg-white px-5 py-3 lg:px-8 lg:py-3.5">
    <div className={cn("flex w-full items-center justify-between gap-3", WIDTH_CLASS[width])}>
      {children}
    </div>
  </div>
);

type OnboardingHeadingProps = {
  readonly step: OnboardingStep;
  readonly title: string;
  readonly subtitle: string;
};

export const OnboardingHeading = ({ step, title, subtitle }: OnboardingHeadingProps) => (
  <div className="flex flex-col gap-1.5">
    <span className="hidden text-xs font-semibold text-success lg:block">
      {onboardingFr.layout.stepOf(step, ONBOARDING_STEP_COUNT)}
    </span>
    <h1 className="text-[22px] leading-tight font-bold tracking-tight">{title}</h1>
    <p className="text-[15px] leading-normal text-muted-foreground lg:text-sm">{subtitle}</p>
  </div>
);
