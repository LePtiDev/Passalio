import { PLATE_READING_DAILY_LIMIT } from "@passalio/shared";
import { Camera, Check, CirclePause, ScanText, TriangleAlert, type LucideIcon } from "lucide-react";
import { useCallback, type ChangeEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PlateReadingState } from "../../hooks/use-plate-reading";
import { plateFr } from "../../plate-fr";
import { SECONDARY_BUTTON_CLASS } from "../customer-styles";

type Tone = "mint" | "amber" | "slate";

const TONES: Readonly<
  Record<Tone, { readonly box: string; readonly icon: string; readonly text: string }>
> = {
  mint: { box: "border-[#9FD3BE] bg-[#F3FAF7]", icon: "text-[#0E7C5A]", text: "text-[#475569]" },
  amber: { box: "border-[#F5D9B0] bg-[#FFFAF2]", icon: "text-[#B45309]", text: "text-[#7A4A12]" },
  slate: { box: "border-[#E3E8EF] bg-[#F7F9FB]", icon: "text-[#0F2A44]", text: "text-[#475569]" },
};

const Banner = ({
  tone,
  icon: Icon,
  title,
  text,
  children,
}: {
  readonly tone: Tone;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly text: string;
  readonly children?: ReactNode;
}) => (
  <output
    className={cn(
      "flex flex-col gap-3 rounded-[12px] border px-3.5 py-3 lg:hidden",
      TONES[tone].box,
    )}
  >
    <div className="flex items-start gap-3">
      <Icon aria-hidden="true" className={cn("size-5 shrink-0", TONES[tone].icon)} />
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{title}</span>
        <span className={cn("text-[13px]", TONES[tone].text)}>{text}</span>
      </div>
    </div>
    {children}
  </output>
);

const RetakeButton = ({ onRetake }: { readonly onRetake: (file: File) => void }) => {
  const pick = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.item(0);
      if (file !== null && file !== undefined) {
        onRetake(file);
      }
    },
    [onRetake],
  );
  return (
    <label
      className={cn(
        SECONDARY_BUTTON_CLASS,
        "inline-flex w-full cursor-pointer items-center justify-center border bg-white focus-within:ring-[3px] focus-within:ring-[#0E7C5A]/20",
      )}
    >
      <Camera aria-hidden="true" className="size-4" />
      {plateFr.retake}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={pick}
      />
    </label>
  );
};

export const PlateReadingBanner = ({
  state,
  onRetake,
}: {
  readonly state: PlateReadingState;
  readonly onRetake: (file: File) => void;
}) => {
  if (state.step === "reading") {
    return (
      <Banner
        tone="slate"
        icon={ScanText}
        title={plateFr.readingTitle}
        text={plateFr.readingText}
      />
    );
  }
  if (state.step === "read") {
    return (
      <Banner
        tone="mint"
        icon={ScanText}
        title={plateFr.readTitle(state.fieldCount)}
        text={
          state.missingIdentity.length === 0
            ? plateFr.readText
            : plateFr.partialText(state.missingIdentity)
        }
      />
    );
  }
  if (state.step === "unreadable") {
    return (
      <Banner
        tone="amber"
        icon={TriangleAlert}
        title={plateFr.unreadableTitle}
        text={plateFr.unreadableText}
      >
        <RetakeButton onRetake={onRetake} />
      </Banner>
    );
  }
  if (state.step === "limit") {
    return (
      <Banner
        tone="amber"
        icon={CirclePause}
        title={plateFr.limitTitle}
        text={plateFr.limitText(PLATE_READING_DAILY_LIMIT)}
      />
    );
  }
  return null;
};

const TileBadge = ({
  className,
  icon: Icon,
  label,
}: {
  readonly className: string;
  readonly icon: LucideIcon;
  readonly label: string;
}) => (
  <span
    className={cn(
      "absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm",
      className,
    )}
  >
    <Icon aria-hidden="true" className="size-3" />
    {label}
  </span>
);

const SCAN_CLASS =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(14,124,90,0.18)_48%,rgba(14,124,90,0.35)_50%,rgba(14,124,90,0.18)_52%,transparent_100%)]";

export const PlateTileOverlay = ({ state }: { readonly state: PlateReadingState }) => {
  if (state.step === "reading") {
    return (
      <>
        <span aria-hidden="true" className={SCAN_CLASS} />
        <TileBadge
          className="bg-white/95 text-[#0F2A44]"
          icon={ScanText}
          label={plateFr.badges.reading}
        />
      </>
    );
  }
  if (state.step === "read") {
    return (
      <TileBadge
        className="bg-white/95 text-[#0E7C5A]"
        icon={Check}
        label={state.isPartial ? plateFr.badges.partial : plateFr.badges.read}
      />
    );
  }
  if (state.step === "unreadable") {
    return (
      <TileBadge
        className="bg-[#FFFAF2] text-[#B45309]"
        icon={TriangleAlert}
        label={plateFr.badges.unreadable}
      />
    );
  }
  return null;
};
