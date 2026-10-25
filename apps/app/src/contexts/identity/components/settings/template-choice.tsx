import { DOCUMENT_TEMPLATES, type BrandColor, type DocumentTemplate } from "@passalio/shared";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { TEMPLATE_TEXTS } from "../../settings-fr";
import { BRAND_BACKGROUND_CLASS } from "../onboarding/brand-color-classes";

const THUMBNAIL_LINES = [
  { id: "title", width: "w-10" },
  { id: "customer", width: "w-8" },
  { id: "equipment", width: "w-10" },
  { id: "result", width: "w-6" },
] as const;

const Thumbnail = ({
  template,
  brandColor,
}: {
  readonly template: DocumentTemplate;
  readonly brandColor: BrandColor;
}) => (
  <span
    aria-hidden="true"
    className="flex h-[88px] w-16 shrink-0 flex-col gap-1.5 overflow-hidden rounded-md border border-[#E3E8EF] bg-white"
  >
    {template === "banner" ? (
      <span className={cn("h-4", BRAND_BACKGROUND_CLASS[brandColor])} />
    ) : (
      <span className="mx-1.5 mt-1.5 flex flex-col gap-1">
        <span className="flex items-center gap-1">
          <span className={cn("size-2 rounded-sm", BRAND_BACKGROUND_CLASS[brandColor])} />
          <span className="h-0.5 flex-1 rounded bg-[#CBD5E1]" />
        </span>
        <span className={cn("h-0.5", BRAND_BACKGROUND_CLASS[brandColor])} />
      </span>
    )}
    {THUMBNAIL_LINES.map(({ id, width }) => (
      <span key={id} className={cn("mx-1.5 h-0.5 rounded bg-[#E3E8EF]", width)} />
    ))}
  </span>
);

const TemplateOption = ({
  template,
  brandColor,
  isSelected,
  isDisabled,
  onSelect,
}: {
  readonly template: DocumentTemplate;
  readonly brandColor: BrandColor;
  readonly isSelected: boolean;
  readonly isDisabled: boolean;
  readonly onSelect: (template: DocumentTemplate) => void;
}) => {
  const select = useCallback(() => onSelect(template), [onSelect, template]);
  const text = TEMPLATE_TEXTS[template];
  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
        isSelected ? "border-2 border-[#0E7C5A] p-[11px]" : "border-[#E3E8EF]",
        isDisabled && "cursor-not-allowed opacity-60",
      )}
    >
      <Thumbnail template={template} brandColor={brandColor} />
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold lg:text-sm">{text.label}</span>
        <span className="text-[13px] text-[#64748B]">{text.text}</span>
      </span>
      <input
        type="radio"
        name="documentTemplate"
        value={template}
        checked={isSelected}
        disabled={isDisabled}
        onChange={select}
        className="size-5 accent-[#0E7C5A]"
      />
    </label>
  );
};

export const TemplateChoice = ({
  value,
  brandColor,
  isDisabled,
  onChange,
}: {
  readonly value: DocumentTemplate;
  readonly brandColor: BrandColor;
  readonly isDisabled: boolean;
  readonly onChange: (template: DocumentTemplate) => void;
}) => (
  <div className="grid gap-2.5 lg:grid-cols-2">
    {DOCUMENT_TEMPLATES.map((template) => (
      <TemplateOption
        key={template}
        template={template}
        brandColor={brandColor}
        isSelected={template === value}
        isDisabled={isDisabled}
        onSelect={onChange}
      />
    ))}
  </div>
);
