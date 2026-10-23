import type { RefObject } from "react";
import { cn } from "@/lib/utils";

type TurnstileSlotProps = {
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly isInteractive: boolean;
};

export const TurnstileSlot = ({ containerRef, isInteractive }: TurnstileSlotProps) => (
  <div ref={containerRef} className={cn(isInteractive && "mb-4 min-h-[65px] lg:mb-3.5")} />
);
