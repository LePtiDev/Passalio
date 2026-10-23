import { Check } from "lucide-react";
import { twoFactorFr } from "../two-factor-fr";
import { AuthShowcaseHeading } from "./auth-showcase-heading";

const text = twoFactorFr.showcase;

export const AdminShowcase = () => (
  <>
    <AuthShowcaseHeading badge={text.badge} title={text.title} />
    <ul className="flex flex-col gap-3 text-sm text-[#D5DEE8]">
      {text.points.map((point) => (
        <li key={point} className="flex items-center gap-2.5">
          <Check aria-hidden="true" className="size-4 text-[var(--brand-mint)]" strokeWidth={2.4} />
          {point}
        </li>
      ))}
    </ul>
  </>
);
