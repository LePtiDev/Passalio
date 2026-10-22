import type { BrandColor } from "@passalio/shared";
import { onboardingFr } from "../../onboarding-fr";
import { cn } from "@/lib/utils";
import { BRAND_BACKGROUND_CLASS, BRAND_TEXT_CLASS } from "./brand-color-classes";
import { formatSiret } from "./display-name";
import { OrganizationMark } from "./organization-mark";

const text = onboardingFr.documents;

const CUSTOMER_LINES = ["w-4/5", "w-[55%]"] as const;
const DEVICE_LINES = ["w-[70%]", "w-1/2"] as const;
const FINDINGS_LINES = ["w-[95%]", "w-4/5"] as const;

type DocumentPreviewProps = {
  readonly name: string;
  readonly address: string | null;
  readonly siret: string | null;
  readonly documentTitle: string;
  readonly documentNumber: string;
  readonly brandColor: BrandColor;
  readonly logoUrl: string | null;
};

const PlaceholderLines = ({
  label,
  widths,
}: {
  readonly label: string;
  readonly widths: readonly string[];
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[11px] text-[#64748B]">{label}</span>
    {widths.map((width) => (
      <span key={width} className={cn("h-2 rounded bg-[#EEF3F8]", width)} />
    ))}
  </div>
);

const SignatureBox = ({ label }: { readonly label: string }) => (
  <span className="flex h-10 items-end rounded-md border border-dashed border-[#CBD5E1] px-1.5 py-1 text-[10px] text-[#94A3B8]">
    {label}
  </span>
);

export const DocumentPreview = ({
  name,
  address,
  siret,
  documentTitle,
  documentNumber,
  brandColor,
  logoUrl,
}: DocumentPreviewProps) => {
  return (
    <div className="flex flex-col gap-2.5" aria-hidden="true">
      <span className="text-xs font-semibold text-muted-foreground">{text.preview}</span>
      <div className="overflow-hidden rounded-[10px] border border-[#E3E8EF] bg-white shadow-[0_24px_48px_-28px_rgba(15,42,68,0.35)]">
        <div className={cn("h-1.5", BRAND_BACKGROUND_CLASS[brandColor])} />
        <div className="flex flex-col gap-4 p-5">
          <div className="flex justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <OrganizationMark
                name={name}
                brandColor={brandColor}
                logoUrl={logoUrl}
                size="small"
              />
              <span className="flex min-w-0 flex-col gap-px">
                <strong className="truncate text-sm">{name}</strong>
                <span className="text-[11px] text-[#64748B]">
                  {address}
                  {address !== null && siret !== null ? " · " : null}
                  {siret === null ? null : (
                    <span className="whitespace-nowrap">SIRET {formatSiret(siret)}</span>
                  )}
                </span>
              </span>
            </div>
            <span className="flex shrink-0 flex-col items-end gap-px">
              <strong className={cn("text-xs", BRAND_TEXT_CLASS[brandColor])}>
                {documentTitle}
              </strong>
              <span className="text-[11px] text-[#64748B] tabular-nums">
                {text.previewNumber(documentNumber)}
              </span>
            </span>
          </div>
          <div className="h-px bg-[#EEF2F6]" />
          <div className="grid grid-cols-2 gap-3">
            <PlaceholderLines label={text.previewCustomer} widths={CUSTOMER_LINES} />
            <PlaceholderLines label={text.previewDevice} widths={DEVICE_LINES} />
            <div className="col-span-2">
              <PlaceholderLines label={text.previewFindings} widths={FINDINGS_LINES} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SignatureBox label={text.previewTechnicianSignature} />
            <SignatureBox label={text.previewCustomerSignature} />
          </div>
        </div>
      </div>
    </div>
  );
};
