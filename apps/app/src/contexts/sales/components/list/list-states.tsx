import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_CARD_CLASS } from "@/contexts/backoffice";

const ROWS = [
  { key: "a", width: "w-44" },
  { key: "b", width: "w-36" },
  { key: "c", width: "w-52" },
  { key: "d", width: "w-32" },
  { key: "e", width: "w-40" },
  { key: "f", width: "w-48" },
];

export const ListSkeleton = () => (
  <div aria-busy="true" className={ADMIN_CARD_CLASS}>
    <div className="hidden h-[38px] border-b border-[#E3E8EF] bg-[#F7F9FB] lg:block" />
    <ul>
      {ROWS.map(({ key, width }) => (
        <li
          key={key}
          className="flex min-h-[72px] items-center gap-3 border-b border-[#EEF2F6] px-3.5 py-2.5 last:border-b-0 lg:min-h-0"
        >
          <Skeleton className="size-9 rounded-full lg:size-7" />
          <span className="flex flex-1 flex-col gap-1.5">
            <Skeleton className={`h-3 ${width}`} />
            <Skeleton className="h-2.5 w-24" />
          </span>
          <Skeleton className="h-5 w-[90px] rounded-md" />
        </li>
      ))}
    </ul>
  </div>
);

type EmptyFrameProps = {
  readonly icon?: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
};

export const EmptyFrame = ({ icon: Icon, title, description, children }: EmptyFrameProps) => (
  <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-[#D5DDE6] bg-white p-5 lg:rounded-xl lg:p-6">
    {Icon === undefined ? null : (
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full bg-[#E6F4EE] text-[#0E7C5A]"
      >
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
    )}
    <span className="flex flex-col gap-1">
      <strong className="text-[15px] font-bold">{title}</strong>
      <span className="text-[13px] text-[#475569]">{description}</span>
    </span>
    <span className="flex flex-wrap gap-2">{children}</span>
  </div>
);
