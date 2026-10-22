import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_TASKS = ["1", "2", "3", "4", "5", "6"];

export const HomeSkeleton = () => (
  <div className="flex flex-wrap items-start gap-4" aria-busy="true">
    <div className="min-w-0 flex-[2_1_520px] overflow-hidden rounded-[14px] border border-[#E3E8EF] bg-white lg:rounded-[10px]">
      <div className="flex items-center justify-between border-b border-[#EEF2F6] p-3.5 lg:px-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-1.5 w-[120px] rounded-full" />
      </div>
      {PLACEHOLDER_TASKS.map((key) => (
        <div
          key={key}
          className="flex min-h-14 items-center gap-3 border-b border-[#EEF2F6] px-3.5 last:border-b-0 lg:min-h-[61px] lg:px-4"
        >
          <Skeleton className="size-5 rounded-full" />
          <span className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="hidden h-3 w-72 lg:block" />
          </span>
        </div>
      ))}
    </div>
    <Skeleton className="h-24 min-w-0 flex-[1_1_280px] rounded-[10px]" />
  </div>
);
