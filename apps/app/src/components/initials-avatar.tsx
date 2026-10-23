import { initialsOf } from "@/lib/initials";
import { cn } from "@/lib/utils";

export type AvatarTone = "mint" | "slate" | "amber";

const TONE_CLASS: Readonly<Record<AvatarTone, string>> = {
  mint: "bg-[#E6F4EE] text-[#0E7C5A]",
  slate: "bg-[#EEF3F8] text-[#0F2A44]",
  amber: "bg-[#FEF3E2] text-[#B45309]",
};

const SIZE_CLASS = {
  small: "size-7 text-xs",
  medium: "size-9 text-[13px] lg:size-7 lg:text-xs",
  large: "size-12 text-base lg:size-11 lg:text-sm",
} as const;

type InitialsAvatarProps = {
  readonly name: string;
  readonly tone: AvatarTone;
  readonly size: keyof typeof SIZE_CLASS;
};

export const InitialsAvatar = ({ name, tone, size }: InitialsAvatarProps) => (
  <span
    aria-hidden="true"
    className={cn(
      "flex shrink-0 items-center justify-center rounded-full font-bold",
      TONE_CLASS[tone],
      SIZE_CLASS[size],
    )}
  >
    {initialsOf(name)}
  </span>
);
