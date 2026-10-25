import { FileCheck2, PenLine, ShieldCheck, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { CARD_CLASS } from "@/contexts/customers";
import { cn } from "@/lib/utils";
import { shortFingerprint, type CertificateIntegrity } from "../../certificate-integrity";
import { documentFr } from "../../document-fr";

const integrityText = (integrity: CertificateIntegrity) =>
  integrity.status === "checking"
    ? documentFr.fingerprintChecking
    : integrity.status === "archiving"
      ? documentFr.fingerprintArchiving
      : integrity.status === "verified"
        ? documentFr.fingerprintVerified(shortFingerprint(integrity.fingerprint))
        : documentFr.fingerprintMismatch(shortFingerprint(integrity.fingerprint));

const Fact = ({
  icon: Icon,
  isAlert = false,
  label,
  children,
}: {
  readonly icon: typeof FileCheck2;
  readonly isAlert?: boolean;
  readonly label: string;
  readonly children: ReactNode;
}) => (
  <div className="flex gap-3 border-t border-[#EEF2F6] px-4 py-3.5 first:border-t-0">
    <Icon
      aria-hidden="true"
      className={cn(
        "mt-0.5 size-5 shrink-0 text-[#94A3B8] lg:size-4",
        isAlert && "text-destructive",
      )}
    />
    <span className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[13px] text-[#64748B]">{label}</dt>
      <dd className="text-[15px] break-words text-[#0F2A44] lg:text-sm">{children}</dd>
    </span>
  </div>
);

export const CertificateFacts = ({
  number,
  signed,
  integrity,
}: {
  readonly number: string;
  readonly signed: string;
  readonly integrity: CertificateIntegrity;
}) => {
  const isMismatch = integrity.status === "mismatch";
  const IntegrityIcon = isMismatch ? ShieldAlert : ShieldCheck;
  return (
    <dl className={CARD_CLASS}>
      <Fact icon={FileCheck2} label={documentFr.numberLabel}>
        {number}
      </Fact>
      <Fact icon={PenLine} label={documentFr.signedLabel}>
        {signed}
      </Fact>
      <Fact icon={IntegrityIcon} isAlert={isMismatch} label={documentFr.fingerprintLabel}>
        <span className={cn(isMismatch && "font-semibold text-destructive")}>
          {integrityText(integrity)}
        </span>
      </Fact>
    </dl>
  );
};
