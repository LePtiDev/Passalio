import { Skeleton } from "@/components/ui/skeleton";
import { configurationFr } from "../../fr-configuration";

const SECTIONS = ["sender", "connection"] as const;

const FIELDS = ["first", "second", "third", "fourth"] as const;

export const ConfigurationSkeleton = () => (
  <div aria-busy="true" aria-label={configurationFr.loading} className="flex flex-col gap-5">
    {SECTIONS.map((section) => (
      <div
        key={section}
        className="flex flex-col gap-3.5 rounded-[14px] border border-[#E3E8EF] bg-white p-4 lg:rounded-xl lg:px-5"
      >
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          {FIELDS.map((field) => (
            <span key={field} className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full rounded-[10px] lg:h-8 lg:rounded-[7px]" />
            </span>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const MailboxStatusSkeleton = () => (
  <div
    aria-hidden="true"
    className="flex flex-col gap-2 rounded-[14px] border border-[#E3E8EF] bg-white p-3.5 lg:rounded-xl lg:px-[18px] lg:py-4"
  >
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-4 w-48" />
  </div>
);
