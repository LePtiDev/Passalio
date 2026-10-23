import { Skeleton } from "@/components/ui/skeleton";

export const AuthorizeSkeleton = () => (
  <div className="flex w-full flex-col gap-5" aria-busy="true">
    <div className="flex flex-col gap-2.5">
      <Skeleton className="h-[26px] w-[85%]" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-3/5" />
    </div>
    <Skeleton className="h-[82px] w-full rounded-[10px]" />
    <Skeleton className="h-4 w-[45%]" />
    <Skeleton className="h-[72px] w-full rounded-[10px]" />
    <Skeleton className="h-[92px] w-full rounded-[10px]" />
    <Skeleton className="h-3.5 w-[90%]" />
    <div className="flex flex-col gap-2.5 lg:flex-row lg:gap-3">
      <Skeleton className="h-12 flex-1 rounded-lg lg:h-11" />
      <Skeleton className="h-12 flex-1 rounded-lg lg:h-11" />
    </div>
  </div>
);
