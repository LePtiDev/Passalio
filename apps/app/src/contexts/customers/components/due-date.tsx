import { cn } from "@/lib/utils";
import type { DueStatus } from "../customer-view";

const TONE: Readonly<Record<DueStatus, { readonly dot: string; readonly text: string } | null>> = {
  overdue: { dot: "bg-[#B42318]", text: "font-semibold text-[#B42318]" },
  near: { dot: "bg-[#D97706]", text: "font-semibold text-[#B45309]" },
  later: null,
};

type DueDateProps = {
  readonly status: DueStatus | null;
  readonly label: string;
  readonly desktopPrefix?: string | undefined;
};

export const DueDate = ({ status, label, desktopPrefix }: DueDateProps) => {
  const tone = status === null ? null : TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap tabular-nums",
        tone === null ? "text-[#475569]" : tone.text,
      )}
    >
      {tone === null ? null : (
        <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", tone.dot)} />
      )}
      {desktopPrefix === undefined ? null : (
        <span className="hidden lg:inline">{desktopPrefix}</span>
      )}
      {label}
    </span>
  );
};
