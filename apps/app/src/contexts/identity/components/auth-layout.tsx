import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/passalio-logo.svg";
import logoWhite from "@/assets/passalio-logo-white.svg";
import { fr } from "@/fr";
import { cn } from "@/lib/utils";
import { LegalLinks } from "@/legal";
import { identityFr } from "../fr";
import { AdminShowcase } from "./admin-showcase";
import { AuthShowcaseHeading, type AuthShowcaseHeadingProps } from "./auth-showcase-heading";
import { SignInShowcase } from "./sign-in-showcase";
import { SignUpClosedShowcase } from "./sign-up-closed-showcase";
import { SignUpShowcase } from "./sign-up-showcase";

const SHOWCASES = {
  "sign-in": <SignInShowcase />,
  "sign-up": <SignUpShowcase />,
  "sign-up-closed": <SignUpClosedShowcase />,
  admin: <AdminShowcase />,
} as const;

type AuthLayoutProps = {
  readonly children: ReactNode;
  readonly showcase: keyof typeof SHOWCASES | AuthShowcaseHeadingProps;
  readonly hasMobileBand?: boolean;
};

const showcaseOf = (showcase: AuthLayoutProps["showcase"]) =>
  typeof showcase === "string" ? SHOWCASES[showcase] : <AuthShowcaseHeading {...showcase} />;

const MobileBrandBand = () => (
  <div className="brand-grid flex h-[150px] shrink-0 flex-col justify-between px-5 py-[22px] lg:hidden">
    <img
      src={logoWhite}
      alt={fr.app.name}
      width={111}
      height={22}
      className="h-[22px] w-auto self-start"
    />
    <p className="text-lg leading-tight font-extrabold tracking-tight text-white">
      {fr.app.tagline}
    </p>
  </div>
);

const AuthFooter = () => (
  <footer className="flex flex-col-reverse items-center gap-1 text-xs text-[#64748B] lg:flex-row lg:justify-between">
    <span className="inline-flex items-center gap-1.5">
      <ShieldCheck aria-hidden="true" className="size-3.5 text-success" />
      {identityFr.authLayout.euHosting}
    </span>
    <LegalLinks className="-mx-1.5 justify-center" />
  </footer>
);

export const AuthLayout = ({ children, showcase, hasMobileBand = true }: AuthLayoutProps) => (
  <div
    className={cn(
      "flex min-h-dvh flex-col lg:flex-row lg:bg-background",
      hasMobileBand ? "bg-[var(--brand-navy)]" : "bg-background",
    )}
  >
    {hasMobileBand ? <MobileBrandBand /> : null}
    <div
      className={cn(
        "flex flex-1 flex-col gap-6 bg-background lg:basis-1/2 lg:rounded-none lg:px-10 lg:py-7",
        hasMobileBand ? "rounded-t-[18px] px-5 pt-6 pb-4" : "px-4 py-5",
      )}
    >
      <img
        src={logo}
        alt={fr.app.name}
        width={121}
        height={24}
        className={cn("h-6 w-auto self-start", hasMobileBand && "hidden lg:block")}
      />
      <main
        className={cn(
          "flex flex-1 justify-center lg:items-center",
          !hasMobileBand && "items-center",
        )}
      >
        <div className="w-full max-w-[360px]">{children}</div>
      </main>
      <AuthFooter />
    </div>
    <aside className="brand-grid hidden flex-col justify-center gap-8 overflow-hidden p-12 text-white lg:flex lg:basis-1/2">
      {showcaseOf(showcase)}
    </aside>
  </div>
);
