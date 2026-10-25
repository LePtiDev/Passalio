import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_CARD_CLASS } from "@/contexts/backoffice";

const TILES = ["calls", "callbacks", "overdue", "demos"];

const ROWS = [
  { key: "a", width: "w-56" },
  { key: "b", width: "w-44" },
  { key: "c", width: "w-64" },
  { key: "d", width: "w-48" },
];

export const TaskRowsSkeleton = () => (
  <div className={ADMIN_CARD_CLASS}>
    <div className="flex h-12 items-center border-b border-[#EEF2F6] px-4">
      <Skeleton className="h-4 w-36" />
    </div>
    <ul>
      {ROWS.map(({ key, width }) => (
        <li
          key={key}
          className="flex min-h-[72px] items-center gap-3 border-b border-[#EEF2F6] px-4 py-3 last:border-b-0 lg:min-h-0"
        >
          <Skeleton className="hidden h-4 w-16 lg:block" />
          <Skeleton className="h-5 w-16 rounded-[7px]" />
          <span className="flex flex-1 flex-col gap-1.5">
            <Skeleton className={`h-3.5 ${width} max-w-full`} />
            <Skeleton className="h-3 w-24" />
          </span>
          <Skeleton className="hidden h-[30px] w-24 rounded-[7px] lg:block" />
        </li>
      ))}
    </ul>
  </div>
);

export const MyDaySkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-4 lg:gap-6">
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
      {TILES.map((key) => (
        <div
          key={key}
          className="flex flex-col gap-2 rounded-[14px] border border-[#E3E8EF] bg-white px-3.5 py-3 lg:rounded-xl lg:px-[18px] lg:py-4"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-10" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
    <Skeleton className="h-12 w-full rounded-[10px] lg:hidden" />
    <TaskRowsSkeleton />
  </div>
);
