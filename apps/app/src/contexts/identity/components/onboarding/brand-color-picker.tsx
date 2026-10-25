import { BRAND_COLORS, type BrandColor } from "@passalio/shared";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { BRAND_COLOR_LABELS, onboardingFr } from "../../onboarding-fr";
import { AUTH_LABEL_CLASS } from "../auth-styles";
import { BRAND_BACKGROUND_CLASS, BRAND_RING_CLASS } from "./brand-color-classes";

type SwatchProps = {
  readonly color: BrandColor;
  readonly isSelected: boolean;
  readonly onSelect: (color: BrandColor) => void;
};

const Swatch = ({ color, isSelected, onSelect }: SwatchProps) => {
  const select = useCallback(() => onSelect(color), [color, onSelect]);
  return (
    <button
      type="button"
      aria-label={BRAND_COLOR_LABELS[color]}
      aria-pressed={isSelected}
      onClick={select}
      className="flex size-12 items-center justify-center rounded-full lg:size-9"
    >
      <span
        className={cn(
          "size-8 rounded-full",
          BRAND_BACKGROUND_CLASS[color],
          isSelected
            ? cn("ring-2 ring-offset-2", BRAND_RING_CLASS[color])
            : "ring-1 ring-[rgba(15,42,68,0.1)]",
        )}
      />
    </button>
  );
};

type BrandColorPickerProps = {
  readonly value: BrandColor;
  readonly onChange: (color: BrandColor) => void;
  readonly legend?: string;
};

export const BrandColorPicker = ({
  value,
  onChange,
  legend = onboardingFr.documents.colorLegend,
}: BrandColorPickerProps) => (
  <fieldset className="flex flex-col gap-1">
    <legend className={cn(AUTH_LABEL_CLASS, "mb-1")}>{legend}</legend>
    <div className="flex gap-1">
      {BRAND_COLORS.map((color) => (
        <Swatch key={color} color={color} isSelected={color === value} onSelect={onChange} />
      ))}
    </div>
  </fieldset>
);
