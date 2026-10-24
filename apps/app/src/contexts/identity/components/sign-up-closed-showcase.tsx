import { identityFr } from "../fr";
import { AuthShowcaseHeading } from "./auth-showcase-heading";

const text = identityFr.signUpClosed;

export const SignUpClosedShowcase = () => (
  <div className="flex max-w-[460px] flex-col gap-4">
    <AuthShowcaseHeading badge={text.showcaseBadge} title={text.showcaseTitle} />
    <p className="text-base leading-relaxed text-white/75">{text.showcaseText}</p>
  </div>
);
