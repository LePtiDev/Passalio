import { Skeleton } from "@/components/ui/skeleton";

const CARD_CLASS =
  "flex flex-col gap-3 rounded-[14px] border border-[#E3E8EF] bg-white p-4 lg:rounded-xl lg:p-[18px]";

const LINES = ["a", "b", "c"];

export const CallDeskSkeleton = () => (
  <div
    aria-busy="true"
    className="grid items-start gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[360px_340px_minmax(0,1fr)]"
  >
    <div className={CARD_CLASS}>
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-3.5 w-56 max-w-full" />
      <Skeleton className="h-12 w-full rounded-[10px] lg:h-11" />
      <Skeleton className="h-3.5 w-40" />
    </div>
    <div className={`${CARD_CLASS} hidden lg:flex`}>
      <Skeleton className="h-4 w-28" />
      {LINES.map((key) => (
        <span key={key} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full rounded-[7px]" />
        </span>
      ))}
    </div>
    <div className={CARD_CLASS}>
      {LINES.map((key) => (
        <span key={key} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-full rounded-[10px] lg:h-8 lg:rounded-[7px]" />
        </span>
      ))}
      <Skeleton className="h-24 w-full rounded-[10px]" />
    </div>
  </div>
);
