import { Skeleton } from "@/components/ui/skeleton";

export const FormSkeleton = () => (
  <div className="flex flex-col gap-4" aria-busy="true">
    <Skeleton className="h-8 w-2/3" />
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);
