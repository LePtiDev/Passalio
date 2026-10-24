import { TriangleAlert } from "lucide-react";
import { useCallback } from "react";
import { useLocalSession } from "@/lib/db/local-database-context";
import { forgetRejections } from "@/lib/sync/sync-rejections";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { customersFr } from "../fr";
import { useSyncIndicator } from "../hooks/use-sync-indicator";

export const MobileRejectionNotice = () => {
  const { database } = useLocalSession();
  const { rejectedCount } = useSyncIndicator();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const acknowledge = useCallback(() => void forgetRejections(database), [database]);
  if (isDesktop || rejectedCount === 0) {
    return null;
  }
  return (
    <output className="fixed inset-x-3 bottom-[92px] z-20 flex items-center gap-3 rounded-[14px] border border-[#F5D9B0] bg-[#FFFAF2] py-1 pr-1 pl-3.5 shadow-[0_12px_24px_-12px_rgba(15,42,68,0.25)]">
      <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-[#B45309]" />
      <span className="flex-1 text-[15px] font-semibold text-[#92400E]">
        {customersFr.sync.rejected(rejectedCount)}
      </span>
      <button
        type="button"
        onClick={acknowledge}
        className="h-12 shrink-0 rounded-[10px] px-4 text-[15px] font-semibold text-[#92400E] hover:bg-[#FEF3E2]"
      >
        {customersFr.sync.acknowledgeRejections}
      </button>
    </output>
  );
};
