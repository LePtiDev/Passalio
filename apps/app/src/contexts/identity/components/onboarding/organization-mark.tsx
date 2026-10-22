import type { BrandColor } from "@passalio/shared";
import { cn } from "@/lib/utils";
import { onboardingFr } from "../../onboarding-fr";
import { BRAND_BACKGROUND_CLASS } from "./brand-color-classes";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

type OrganizationMarkProps = {
  readonly name: string;
  readonly brandColor: BrandColor;
  readonly logoUrl: string | null;
  readonly size: "small" | "large";
};

export const OrganizationMark = ({ name, brandColor, logoUrl, size }: OrganizationMarkProps) => {
  const sizeClass =
    size === "large" ? "size-11 rounded-[10px] text-[15px]" : "size-9 rounded-lg text-[13px]";
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
