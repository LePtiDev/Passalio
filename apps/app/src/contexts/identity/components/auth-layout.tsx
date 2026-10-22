import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/passalio-logo.svg";
import logoWhite from "@/assets/passalio-logo-white.svg";
import { fr } from "@/fr";
import { identityFr } from "../fr";
import { SignInShowcase } from "./sign-in-showcase";
import { SignUpShowcase } from "./sign-up-showcase";

type AuthLayoutProps = {
  readonly children: ReactNode;
  readonly showcase: "sign-in" | "sign-up";
};

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
  <footer className="flex flex-wrap justify-center gap-4 text-xs text-[#64748B] lg:justify-between">
    <span className="inline-flex items-center gap-1.5">
      <ShieldCheck aria-hidden="true" className="size-3.5 text-success" />
      {identityFr.authLayout.euHosting}
    </span>
  </footer>
);

export const AuthLayout = ({ children, showcase }: AuthLayoutProps) => (
  <div className="flex min-h-dvh flex-col bg-[var(--brand-navy)] lg:flex-row lg:bg-background">
    <MobileBrandBand />
    <div className="flex flex-1 flex-col gap-6 rounded-t-[18px] bg-background px-5 pt-6 pb-4 lg:basis-1/2 lg:rounded-none lg:px-10 lg:py-7">
      <img
        src={logo}
        alt={fr.app.name}
        width={121}
        height={24}
        className="hidden h-6 w-auto self-start lg:block"
      />
      <main className="flex flex-1 justify-center lg:items-center">
        <div className="w-full max-w-[360px]">{children}</div>
      </main>
      <AuthFooter />
    </div>
    <aside className="brand-grid hidden flex-col justify-center gap-8 overflow-hidden p-12 text-white lg:flex lg:basis-1/2">
      {showcase === "sign-up" ? <SignUpShowcase /> : <SignInShowcase />}
    </aside>
  </div>
);
