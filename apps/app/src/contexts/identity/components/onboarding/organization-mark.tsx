import type { BrandColor } from "@passalio/shared";
import { initialsOf } from "@/lib/initials";
import { cn } from "@/lib/utils";
import { onboardingFr } from "../../onboarding-fr";
import { BRAND_BACKGROUND_CLASS } from "./brand-color-classes";

const MARK_SIZE_CLASS = {
  tiny: "size-8 rounded-lg text-xs lg:size-[26px] lg:rounded-md lg:text-[11px]",
  small: "size-9 rounded-lg text-[13px]",
  large: "size-11 rounded-[10px] text-[15px]",
} as const;

type OrganizationMarkProps = {
  readonly name: string;
  readonly brandColor: BrandColor;
  readonly logoUrl: string | null;
  readonly size: "tiny" | "small" | "large";
};

export const OrganizationMark = ({ name, brandColor, logoUrl, size }: OrganizationMarkProps) => {
  const sizeClass = MARK_SIZE_CLASS[size];
  if (logoUrl !== null) {
    return (
      <img
        src={logoUrl}
        alt={onboardingFr.documents.logoAlt}
        className={cn("shrink-0 bg-white object-contain", sizeClass)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center font-extrabold text-white",
        BRAND_BACKGROUND_CLASS[brandColor],
        sizeClass,
      )}
    >
      {initialsOf(name)}
    </span>
  );
};
