import { Info, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TONES = {
  info: "bg-[#F1F5F9] text-[#334155]",
  pending: "bg-[#EAF1FB] text-[#1D4F91]",
  warning: "bg-[#FEF3E2] text-[#7A3B05]",
} as const;

export type NoticeTone = keyof typeof TONES;

type SubscriptionNoticeProps = {
  readonly tone: NoticeTone;
  readonly title: string;
  readonly text: string;
  readonly actionLabel?: string;
  readonly isActionDisabled?: boolean;
  readonly onAction?: () => void;
};

export const SubscriptionNotice = ({
  tone,
  title,
  text,
  actionLabel,
  isActionDisabled = false,
  onAction,
}: SubscriptionNoticeProps) => {
  const Icon = tone === "warning" ? TriangleAlert : Info;
  return (
    <div
      role={tone === "warning" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-[10px] px-3.5 py-3 text-[14px] lg:flex-row lg:items-start lg:text-[13px]",
        TONES[tone],
      )}
    >
      <span className="flex flex-1 gap-3">
        <Icon aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" strokeWidth={1.8} />
        <span className="flex flex-col gap-0.5 leading-normal">
          <strong>{title}</strong>
          <span>{text}</span>
        </span>
      </span>
      {actionLabel === undefined ? null : (
        <Button
          type="button"
          disabled={isActionDisabled}
          onClick={onAction}
          className="w-full lg:w-auto lg:self-center"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
