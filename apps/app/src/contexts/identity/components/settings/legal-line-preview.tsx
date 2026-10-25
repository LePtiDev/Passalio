import { CircleAlert } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { legalLineParts, type LegalLineDraft } from "../../legal-line-parts";
import { LEGAL_MENTION_LABELS, settingsFr } from "../../settings-fr";
import type { LegalMention } from "@passalio/trades";

const text = settingsFr.company;

export const LegalLinePreview = ({ draft }: { readonly draft: LegalLineDraft }) => (
  <div className="flex flex-col gap-4">
    <h2 className="text-sm font-semibold text-[#334155]">{text.previewTitle}</h2>
    <div className="flex flex-col gap-2 rounded-xl border border-[#E3E8EF] bg-white p-4 shadow-[0_1px_2px_rgba(15,42,68,0.05)]">
      <span className="text-[11px] font-bold tracking-wide uppercase">{text.previewLabel}</span>
      <p className="text-xs leading-relaxed text-[#64748B]" data-testid="legal-line">
        {legalLineParts(draft).map((part, index) => (
          <Fragment key={part.id}>
            {index === 0 ? null : " "}
            <span
              className={cn(
                part.isMissing && "rounded bg-[#FDEDEC] px-1 font-medium text-destructive",
              )}
            >
              {part.text}
            </span>
          </Fragment>
        ))}
      </p>
    </div>
    <p className="text-[13px] leading-relaxed text-[#64748B]">{text.fieldNote}</p>
  </div>
);

export const MissingMentionsBanner = ({
  mentions,
}: {
  readonly mentions: readonly LegalMention[];
}) =>
  mentions.length === 0 ? null : (
    <div className="flex gap-3 rounded-[14px] border border-[#F5D9A8] bg-[#FFF8EB] p-4 text-[#7A4B00] lg:rounded-xl">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#B54708]" />
      <span className="flex flex-col gap-1">
        <span className="text-[15px] font-bold lg:text-sm">{text.missingTitle}</span>
        <span className="text-sm lg:text-[13px]">{text.missingText}</span>
        <span className="text-sm font-medium lg:text-[13px]">
          {mentions.map((mention) => LEGAL_MENTION_LABELS[mention]).join(", ")}
        </span>
      </span>
    </div>
  );
