import { CloudOff } from "lucide-react";
import { useCallback } from "react";
import { useLocalSession } from "@/lib/db/local-database-context";
import { forgetRejections } from "@/lib/sync/sync-rejections";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { customersFr } from "../fr";
import { useSyncIndicator } from "../hooks/use-sync-indicator";

export const SyncPill = () => {
  const { isOffline, label, phase, rejectedCount, errorCode } = useSyncIndicator();
  const { database } = useLocalSession();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const acknowledge = useCallback(() => void forgetRejections(database), [database]);
  const hasRejections = rejectedCount > 0 && isDesktop;
  return (
    <output
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        isOffline || phase === "error" || hasRejections
          ? "bg-[#FEF3E2] text-[#B45309]"
          : "bg-[#E6F4EE] text-[#0E7C5A]",
      )}
    >
      {isOffline ? (
        <CloudOff aria-hidden="true" className="size-3.5" />
      ) : (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      )}
      <span>{label}</span>
      {errorCode === undefined ? null : (
        <>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{errorCode}</span>
        </>
      )}
      {hasRejections ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{customersFr.sync.rejected(rejectedCount)}</span>
          <button
            type="button"
            onClick={acknowledge}
            className="-my-1 rounded-full px-2 py-1 underline underline-offset-2 hover:bg-white/60"
          >
            {customersFr.sync.acknowledgeRejections}
          </button>
        </>
      ) : null}
    </output>
  );
};

export const MobileSyncLine = ({ prefix }: { readonly prefix?: string | undefined }) => {
  const { isOffline, label, phase, rejectedCount, errorCode } = useSyncIndicator();
  if (phase === "error" || (!isOffline && rejectedCount > 0)) {
    const detail = phase === "error" ? errorCode : customersFr.sync.rejectedShort(rejectedCount);
    return (
      <span className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-[#B45309]">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#D97706]" />
        <span>{label}</span>
        {detail === undefined ? null : (
          <>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{detail}</span>
          </>
        )}
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
