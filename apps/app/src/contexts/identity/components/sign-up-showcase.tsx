import { Check } from "lucide-react";
import { identityFr } from "../fr";
import { AuthShowcaseHeading } from "./auth-showcase-heading";

const text = identityFr.authLayout;

export const SignUpShowcase = () => (
  <>
    <AuthShowcaseHeading badge={text.benefitsBadge} title={text.benefitsTitle} />
    <ul className="flex max-w-[460px] flex-col gap-5">
      {text.benefits.map((benefit) => (
        <li key={benefit.title} className="flex gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgb(52_211_153/0.15)]">
            <Check
              aria-hidden="true"
              className="size-3.5 text-[var(--brand-mint)]"
              strokeWidth={2.6}
            />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-[15px] font-bold">{benefit.title}</span>
            <span className="text-sm text-[#A9B8C8]">{benefit.text}</span>
          </span>
        </li>
      ))}
    </ul>
    <p className="max-w-[460px] border-t border-white/12 pt-5 text-sm text-[#A9B8C8]">
      {text.pricing}
    </p>
  </>
);
