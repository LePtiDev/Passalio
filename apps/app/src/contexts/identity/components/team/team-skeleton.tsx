import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MEMBER_GRID_CLASS, TEAM_CARD_CLASS } from "./team-styles";

const PLACEHOLDER_ROWS = ["first", "second", "third"];

export const TeamSkeleton = () => (
  <ul className={TEAM_CARD_CLASS} aria-busy="true">
    {PLACEHOLDER_ROWS.map((key) => (
      <li
        key={key}
        className={cn(
          MEMBER_GRID_CLASS,
          "min-h-16 border-b border-[#EEF2F6] py-2 pr-3.5 pl-3.5 last:border-b-0 lg:min-h-12",
        )}
      >
        <span className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full lg:size-7" />
          <span className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </span>
        </span>
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="hidden h-3.5 w-24 lg:block" />
        <span />
      </li>
    ))}
  </ul>
);

export const TeamScreenSkeleton = () => (
  <div className="flex flex-col gap-4 p-4 lg:gap-5 lg:p-6" aria-busy="true">
    <span className="flex flex-col gap-2">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full max-w-md" />
    </span>
    <Skeleton className="h-11 w-full max-w-sm rounded-xl" />
    <TeamSkeleton />
  </div>
);
