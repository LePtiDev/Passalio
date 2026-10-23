import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_CARD_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { EmptyFrame } from "../list/list-states";

const LINES = ["a", "b", "c", "d"];

export const FileSkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-4 lg:gap-5">
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-3.5 w-48" />
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
      <div className={cn(ADMIN_CARD_CLASS, "flex flex-col")}>
        {LINES.map((key) => (
          <div
            key={key}
            className="flex items-center gap-3 border-b border-[#EEF2F6] px-3.5 py-3 last:border-b-0"
          >
            <Skeleton className="size-9 rounded-full lg:size-7" />
            <span className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2.5 w-24" />
            </span>
          </div>
        ))}
      </div>
      <div className={cn(ADMIN_CARD_CLASS, "flex flex-col gap-3 p-3.5")}>
        {LINES.map((key) => (
          <span key={key} className="flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-3 w-36" />
          </span>
        ))}
      </div>
    </div>
  </div>
);

export const RecordNotFound = ({
  to,
}: {
  readonly to: "/admin/entreprises" | "/admin/contacts";
}) => (
  <EmptyFrame title={salesFr.file.notFoundTitle} description={salesFr.file.notFoundText}>
    <Link
      to={to}
      className={cn(buttonVariants({ variant: "outline" }), ADMIN_SECONDARY_BUTTON_CLASS)}
    >
      {salesFr.file.backToList}
    </Link>
  </EmptyFrame>
);
