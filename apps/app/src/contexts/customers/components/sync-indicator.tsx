import { CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSyncIndicator } from "../hooks/use-sync-indicator";

export const SyncPill = () => {
  const { isOffline, label, phase } = useSyncIndicator();
  return (
    <output
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        isOffline || phase === "error"
          ? "bg-[#FEF3E2] text-[#B45309]"
          : "bg-[#E6F4EE] text-[#0E7C5A]",
      )}
    >
      {isOffline ? (
        <CloudOff aria-hidden="true" className="size-3.5" />
      ) : (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      )}
      {label}
    </output>
  );
};

export const MobileSyncLine = ({ prefix }: { readonly prefix?: string | undefined }) => {
  const { isOffline, label, phase } = useSyncIndicator();
  if (phase === "error") {
    return (
      <span className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-[#B45309]">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#D97706]" />
        {label}
      </span>
    );
  }
  if (isOffline) {
    return (
      <span className="inline-flex items-center gap-1 truncate text-[13px] font-semibold text-[#B45309]">
        <CloudOff aria-hidden="true" className="size-3.5 shrink-0" />
        {label}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 truncate text-[13px] text-[#64748B]">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#0E7C5A]" />
      {prefix === undefined ? label : `${prefix} · ${label.toLowerCase()}`}
    </span>
  );
};

export const OfflineBanner = ({
  title,
  text,
}: {
  readonly title: string;
  readonly text: string;
}) => (
  <output className="flex items-start gap-3 rounded-[14px] border border-[#F5D9B0] bg-[#FFFAF2] p-3.5 lg:items-center lg:rounded-xl">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-[#E8B877] text-[#B45309] lg:size-8">
      <CloudOff aria-hidden="true" className="size-4" />
    </span>
    <span className="flex flex-col gap-0.5">
      <span className="text-[15px] font-semibold lg:text-[13px]">{title}</span>
      <span className="text-[13px] text-[#B45309]">{text}</span>
    </span>
  </output>
);
