import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, ADMIN_TABLE_HEADER_CLASS } from "../admin-styles";
import { TEAM_GRID_CLASS, TEAM_ROW_CLASS } from "./team-styles";

const ROWS = ["a", "b", "c"];

export const TeamSkeleton = () => (
  <div className={ADMIN_CARD_CLASS} aria-busy="true">
    <div aria-hidden="true" className={cn(ADMIN_TABLE_HEADER_CLASS, "h-10")} />
    {ROWS.map((key) => (
      <div key={key} className={cn(TEAM_GRID_CLASS, TEAM_ROW_CLASS)}>
        <span className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full lg:size-7" />
          <span className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-44" />
          </span>
        </span>
        <Skeleton className="hidden h-5 w-20 rounded-md lg:block" />
        <Skeleton className="hidden h-3.5 w-28 lg:block" />
        <Skeleton className="hidden h-3.5 w-20 lg:block" />
        <span className="hidden justify-end gap-1.5 lg:flex">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-16" />
        </span>
      </div>
    ))}
  </div>
);
