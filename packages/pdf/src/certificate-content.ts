import { err, ok, type Result } from "@passalio/shared";
import {
  checkCertificate,
  nextSweepingDueDate,
  type CertificateError,
  type ChimneySweepingCertificate,
} from "@passalio/trades";
import type { AdviceCard } from "./advice-fr";
import { adviceCardsOf, isAdviceDue } from "./certificate-advice";
import { equipmentFieldsOf, fluesOf, type Field, type FlueRow } from "./certificate-equipment";
import { legalLineOf } from "./certificate-legal-line";
import { certificatePdfInput, type CertificatePdfInput } from "./certificate-pdf-input";
import { longDate, parisDateAndTime } from "./format";
import { pdfFr } from "./fr";

export type CertificatePdfError =
  | CertificateError
  | "invalid_pdf_input"
  | "sealed_appliance_not_supported"
  | "unreadable_image";

export type Run = { readonly text: string; readonly isStrong: boolean };

export type Check = { readonly isMet: boolean; readonly runs: readonly Run[] };

export type CertificateContent = {
  readonly number: string;
  readonly signedOn: string;
  readonly dates: readonly [Field, Field, Field];
  readonly customer: { readonly name: string; readonly address: string };
  readonly site: { readonly label: string; readonly address: string };
  readonly equipment: readonly Field[];
  readonly flues: readonly FlueRow[];
  readonly checks: readonly Check[];
  readonly doNotUse: { readonly title: string; readonly body: string } | null;
  readonly observations: string | null;
  readonly technician: {
    readonly label: string;
    readonly signature: string;
    readonly note: string;
  };
  readonly customerSignature:
    | { readonly isAbsent: false; readonly signature: string; readonly note: string }
    | { readonly isAbsent: true; readonly note: string };
  readonly advice: readonly AdviceCard[] | null;
  readonly legalLine: string;
};

const run = (text: string, isStrong = false): Run => ({ text, isStrong });

const vacuityCheck = (certificate: ChimneySweepingCertificate): Check => {
  const text = pdfFr.checks;
  if (certificate.sweepingExtent === "full_length") {
    const pipe = certificate.isConnectionPipeSwept
      ? text.withConnectionPipe
      : text.withoutConnectionPipe;
    return { isMet: true, runs: [run(text.vacuityStrong, true), run(pipe)] };
  }
  const unswept = certificate.unsweptPart === null ? "" : text.unsweptPart(certificate.unsweptPart);
  return { isMet: false, runs: [run(text.partialStrong, true), run(unswept)] };
};

const checksOf = (certificate: ChimneySweepingCertificate): readonly Check[] => [
  { isMet: true, runs: [run(pdfFr.checks.mechanical)] },
  vacuityCheck(certificate),
  {
    isMet: certificate.chimneyStacks === "good",
    runs: [run(pdfFr.checks.stacks[certificate.chimneyStacks])],
  },
];

const datesOf = (certificate: ChimneySweepingCertificate): readonly [Field, Field, Field] => {
  const text = pdfFr.certificate;
  const next = certificate.isDoNotUse
    ? text.nextSweepingAfterRepair
    : longDate(nextSweepingDueDate(certificate.completedOn));
  return [
    { label: text.visitedOn, value: longDate(certificate.visitedOn) },
    { label: text.completedOn, value: longDate(certificate.completedOn) },
    { label: text.nextSweeping, value: next },
  ];
};

const signaturesOf = ({ certificate, document }: CertificatePdfInput) => {
  const signedAt = parisDateAndTime(document.signedAt);
  const note = pdfFr.signatures.signedAt(signedAt.date, signedAt.time);
  const technician = {
    label: pdfFr.signatures.technicianLabel(
      certificate.technician.name,
      certificate.company.qualification,
    ),
    signature: certificate.technicianSignature,
    note,
  };
  const customerSignature =
    certificate.customerSignature === null
      ? { isAbsent: true as const, note: pdfFr.signatures.customerAbsentNote }
      : { isAbsent: false as const, signature: certificate.customerSignature, note };
  return { technician, customerSignature, signedOn: signedAt.calendarDate };
};

const contentOf = (input: CertificatePdfInput): CertificateContent => {
  const { certificate } = input;
  const { technician, customerSignature, signedOn } = signaturesOf(input);
  return {
    number: input.document.number,
    signedOn,
    dates: datesOf(certificate),
    customer: certificate.customer,
    site: {
      label: certificate.site.room ?? pdfFr.certificate.site,
      address: certificate.site.address,
    },
    equipment: equipmentFieldsOf(certificate),
    flues: fluesOf(certificate),
    checks: checksOf(certificate),
    doNotUse: certificate.isDoNotUse ? pdfFr.doNotUse : null,
    observations: certificate.anomalies,
    technician,
    customerSignature,
    advice: isAdviceDue(certificate) ? adviceCardsOf(certificate.equipment) : null,
    legalLine: legalLineOf(certificate.company),
  };
};

export const certificateContent = (
  data: unknown,
): Result<{ input: CertificatePdfInput; content: CertificateContent }, CertificatePdfError> => {
  const parsed = certificatePdfInput.safeParse(data);
  if (!parsed.success) {
    return err("invalid_pdf_input");
  }
  const { certificate } = parsed.data;
  const checked = checkCertificate(certificate, {
    kind: certificate.equipment.kind,
    flueType: certificate.equipment.flueType,
  });
  if (!checked.isOk) {
    return checked;
  }
  if (certificate.sweepingExtent === "sealed_appliance") {
    return err("sealed_appliance_not_supported");
  }
  return ok({ input: parsed.data, content: contentOf(parsed.data) });
};
