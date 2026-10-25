import { Skeleton } from "@/components/ui/skeleton";
import { settingsFr } from "../../settings-fr";
import { ADMIN_CARD_CLASS } from "../admin-styles";

export const SettingsSkeleton = () => (
  <section aria-busy="true" aria-label={settingsFr.loading} className={ADMIN_CARD_CLASS}>
    <div className="border-b border-[#E3E8EF] px-4 py-3">
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="flex items-start justify-between gap-4 p-4">
      <span className="flex flex-1 flex-col gap-2">
        <span className="flex gap-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-5 w-16 rounded-md" />
        </span>
        <Skeleton className="h-3.5 w-full max-w-md" />
        <Skeleton className="h-3 w-48" />
      </span>
      <Skeleton className="h-[22px] w-10 rounded-full" />
    </div>
    <div className="grid gap-4 border-t border-[#EEF2F6] p-4 lg:grid-cols-2">
      <Skeleton className="h-24" />
      <Skeleton className="h-16" />
    </div>
  </section>
);
