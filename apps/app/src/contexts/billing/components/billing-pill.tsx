import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  blue: "bg-[#EAF1FB] text-[#1D4F91]",
  green: "bg-[#E6F4EE] text-[#0B5B43]",
  amber: "bg-[#FEF3E2] text-[#9A4A06]",
  slate: "bg-[#EEF2F6] text-[#334155]",
  navy: "bg-[#0F2A44] text-white",
} as const;

export type PillTone = keyof typeof TONES;

export const BillingPill = ({
  tone,
  children,
}: {
  readonly tone: PillTone;
  readonly children: ReactNode;
}) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[12px] font-semibold",
      TONES[tone],
    )}
  >
    {children}
  </span>
);
