import { Skeleton } from "@/components/ui/skeleton";
import { CARD_CLASS } from "../customer-styles";

const CardSkeleton = ({ rows }: { readonly rows: number }) => (
  <div className={CARD_CLASS}>
    <div className="flex items-start gap-3 p-3.5">
      <Skeleton className="size-9 rounded-lg lg:size-8" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3.5 w-56" />
      </div>
    </div>
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="flex items-center gap-3 border-t border-[#EEF2F6] px-3.5 py-3">
        <Skeleton className="size-9 rounded-lg lg:size-8" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-60" />
        </div>
      </div>
    ))}
  </div>
);

export const CustomerFileSkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-4 lg:gap-5">
    <div className="flex items-center gap-3">
      <Skeleton className="size-12 rounded-full lg:size-11" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3.5 w-60" />
      </div>
    </div>
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-5">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-36" />
        <CardSkeleton rows={2} />
      </div>
      <CardSkeleton rows={3} />
    </div>
  </div>
);
