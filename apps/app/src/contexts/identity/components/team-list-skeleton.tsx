import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_ROWS = ["first", "second", "third"];

export const TeamListSkeleton = () => (
  <ul className="flex flex-col gap-3" aria-busy="true">
    {PLACEHOLDER_ROWS.map((key) => (
      <li key={key} className="flex items-start justify-between gap-2 rounded-lg border p-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </li>
    ))}
  </ul>
);
