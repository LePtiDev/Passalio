import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_CARD_CLASS } from "../admin-styles";

const TILES = ["accounts", "trial", "people", "dropping"];
const ROWS = ["first", "second", "third", "fourth"];

export const OverviewSkeleton = () => (
  <div className="flex flex-col gap-4 lg:gap-5" aria-busy="true">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {TILES.map((key) => (
        <div
          key={key}
          className="flex flex-col gap-2 rounded-[14px] border border-[#E3E8EF] bg-white p-4 lg:rounded-xl"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-5">
      <div className={ADMIN_CARD_CLASS}>
        <div className="border-b border-[#E3E8EF] px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        {ROWS.map((key) => (
          <div
            key={key}
            className="flex items-center gap-3 border-b border-[#EEF2F6] px-4 py-3 last:border-b-0"
          >
            <Skeleton className="size-7 rounded-full" />
            <span className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-3 w-24" />
            </span>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
      <div className={ADMIN_CARD_CLASS}>
        <div className="border-b border-[#E3E8EF] px-4 py-3">
          <Skeleton className="h-4 w-36" />
        </div>
        {ROWS.slice(0, 3).map((key) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-[#EEF2F6] px-4 py-3 last:border-b-0"
          >
            <span className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-28" />
            </span>
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
