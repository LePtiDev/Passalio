import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useCallback } from "react";
import logo from "@/assets/passalio-logo.svg";
import { fr } from "@/fr";
import { authClient } from "@/lib/auth-client";
import { SIGN_IN_PATH } from "@/lib/session";
import { cn } from "@/lib/utils";
import { onboardingFr } from "../../onboarding-fr";
import type { OnboardingStep } from "./onboarding-steps";

const text = onboardingFr.layout;

const StepMarker = ({ number, current }: { readonly number: number; readonly current: number }) => {
  if (number < current) {
    return (
      <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-success">
        <Check aria-hidden="true" className="size-3 text-white" strokeWidth={3.2} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold",
        number === current
          ? "border-2 border-[var(--brand-navy)] text-[var(--brand-navy)]"
          : "border border-[#CBD5E1] text-[#94A3B8]",
      )}
    >
      {number}
    </span>
  );
};

export const OnboardingSidebar = ({ step }: { readonly step: OnboardingStep }) => {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const signOut = useCallback(async () => {
    await authClient.signOut();
    await navigate({ to: SIGN_IN_PATH });
  }, [navigate]);

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-7 border-r border-[#E3E8EF] bg-[#F7F9FB] px-5 py-6 lg:flex">
      <img
        src={logo}
        alt={fr.app.name}
        width={111}
        height={22}
        className="h-[22px] w-auto self-start"
      />
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-bold">{text.title}</span>
        <span className="text-xs text-[#64748B]">{text.duration}</span>
      </div>
      <ol className="flex flex-col">
        {text.steps.map((item, index) => {
          const number = index + 1;
          return (
            <li
              key={item.label}
              className="flex gap-3 pb-[18px]"
              aria-current={number === step ? "step" : undefined}
            >
              <StepMarker number={number} current={step} />
              <span className="flex flex-col gap-px pt-0.5">
                <span
                  className={cn(
                    "text-[13px]",
                    number === step ? "font-bold" : "font-medium",
                    number > step ? "text-[#64748B]" : "text-foreground",
                  )}
                >
                  {item.label}
                </span>
                <span className="text-xs text-[#64748B]">{item.hint}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-auto flex flex-col gap-2.5 text-xs text-[#64748B]">
        {session === null || session === undefined ? null : (
          <span className="break-words">
            {text.signedInAs} <strong className="text-foreground">{session.user.email}</strong>
          </span>
        )}
        <button
          type="button"
          onClick={signOut}
          className="self-start font-semibold text-muted-foreground hover:text-foreground"
        >
          {text.signOut}
        </button>
      </div>
    </aside>
  );
};
