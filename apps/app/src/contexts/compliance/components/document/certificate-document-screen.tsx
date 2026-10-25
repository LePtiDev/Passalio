import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useMemo } from "react";
import { DesktopTopBar } from "@/components/app-shell/page-bars";
import { Button } from "@/components/ui/button";
import { customerNameOf, DASHED_CARD_CLASS, equipmentNameOf, SyncPill } from "@/contexts/customers";
import { cn } from "@/lib/utils";
import { documentFr } from "../../document-fr";
import { useCertificateIntegrity, useCertificatePages } from "../../hooks/use-certificate-check";
import {
  useCertificateDocument,
  type CertificateDocument,
} from "../../hooks/use-certificate-document";
import { useCertificatePdf } from "../../hooks/use-certificate-pdf";
import { numberOf, signedAtLabel } from "../../signed-labels";
import { CertificateSkeleton } from "../visit-states";
import { DesktopCertificateActions, MobileCertificateActions } from "./certificate-actions";
import { CertificateFacts } from "./certificate-facts";
import { CertificatePages } from "./certificate-pages";

const textOf = (value: unknown, key: string) =>
  typeof value === "object" && value !== null && key in value
    ? String(Object.entries(value).find(([name]) => name === key)?.[1] ?? "")
    : "";

const noteOf = ({ correctedBy, corrects }: CertificateDocument) => {
  if (correctedBy !== undefined) {
    return documentFr.cancelledBy(numberOf(correctedBy));
  }
  return corrects === undefined
    ? documentFr.immutable
    : documentFr.correctionOf(numberOf(corrects));
};

const StatusBadge = ({ isCancelled }: { readonly isCancelled: boolean }) => (
  <span
    className={cn(
      "rounded-[7px] px-2 py-0.5 text-[13px] font-semibold",
      isCancelled ? "bg-[#FDECEC] text-[#B42318]" : "bg-[#E6F4EE] text-[#0B6349]",
    )}
  >
    {isCancelled ? documentFr.cancelled : documentFr.signed}
  </span>
);

const BackLink = ({ customerId }: { readonly customerId: string | undefined }) => {
  const params = useMemo(() => ({ customerId: customerId ?? "" }), [customerId]);
  const className = "-ml-1 flex size-12 shrink-0 items-center justify-center rounded-xl";
  const icon = <ChevronLeft aria-hidden="true" className="size-[22px]" />;
  return customerId === undefined ? (
    <Link to="/clients" aria-label={documentFr.back} className={className}>
      {icon}
    </Link>
  ) : (
    <Link
      to="/clients/$customerId"
      params={params}
      aria-label={documentFr.back}
      className={className}
    >
      {icon}
    </Link>
  );
};

const DocumentBody = ({ certificate }: { readonly certificate: CertificateDocument }) => {
  const { document, customer, equipment, correctedBy, isPending } = certificate;
  const pdf = useCertificatePdf(document);
  const pages = useCertificatePages(pdf, document);
  const integrity = useCertificateIntegrity(pdf, document);
  const number = numberOf(document);
  const customerName =
    customer === undefined ? textOf(document.data["customer"], "name") : customerNameOf(customer);
  const technician = textOf(document.data["technician"], "name");
  const at = signedAtLabel(document.signedAt);
  const isCancelled = correctedBy !== undefined;
  const status = isCancelled ? documentFr.cancelled : documentFr.signed;
  const trail = useMemo(
    () => [
      { label: documentFr.clients, to: "/clients" as const },
      { label: customerName },
      { label: number },
    ],
    [customerName, number],
  );
  const subtitle = documentFr.subtitle(
    customerName,
    equipment === undefined ? "" : equipmentNameOf(equipment),
    at,
    technician,
  );
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-white pb-[100px] lg:pb-0">
      <DesktopTopBar trail={trail}>
        <SyncPill />
      </DesktopTopBar>
      <header className="sticky top-0 z-10 flex min-h-16 items-center gap-2 border-b border-[#E3E8EF] bg-white px-3 py-2 lg:hidden">
        <BackLink customerId={customer?.id} />
        <span className="flex min-w-0 flex-col">
          <h1 className="truncate text-[17px] font-bold">{number}</h1>
          <span className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", isCancelled ? "bg-[#B42318]" : "bg-[#0E7C5A]")}
            />
            {documentFr.mobileStatus(
              status,
              isPending ? documentFr.syncPending : documentFr.synced,
            )}
          </span>
        </span>
      </header>
      <div className="flex w-full flex-col gap-5 p-4 lg:p-6">
        <div className="hidden items-start justify-between gap-4 lg:flex">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="flex items-center gap-3 text-xl font-bold tracking-[-0.015em]">
              {documentFr.title(number)}
              <StatusBadge isCancelled={isCancelled} />
            </h1>
            <p className="text-[13px] text-[#475569]">{subtitle}</p>
          </div>
          <DesktopCertificateActions pdf={pdf} />
        </div>
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-5">
          <div className="rounded-[16px] bg-[#EEF2F6] p-3 lg:rounded-xl lg:p-8">
            <CertificatePages pages={pages} />
          </div>
          <div className="flex flex-col gap-3">
            <CertificateFacts
              number={number}
              signed={documentFr.signedValue(at, technician)}
              integrity={integrity}
            />
            <p className="text-[13px] text-[#64748B]">{noteOf(certificate)}</p>
          </div>
        </div>
      </div>
      <MobileCertificateActions pdf={pdf} />
    </div>
  );
};

const DocumentNotFound = () => (
  <div className="mx-auto flex w-full max-w-[600px] flex-col gap-4 p-4 lg:max-w-[800px] lg:py-8">
    <div className={DASHED_CARD_CLASS}>
      <span className="flex flex-col gap-1">
        <h1 className="text-[17px] font-bold lg:text-[15px]">{documentFr.notFoundTitle}</h1>
        <p className="text-[15px] text-[#475569] lg:text-[13px]">{documentFr.notFoundText}</p>
      </span>
      <Button asChild variant="secondary">
        <Link to="/clients">{documentFr.notFoundBack}</Link>
      </Button>
    </div>
  </div>
);

export const CertificateDocumentScreen = ({ documentId }: { readonly documentId: string }) => {
  const certificate = useCertificateDocument(documentId);
  if (certificate === undefined) {
    return <CertificateSkeleton />;
  }
  return certificate === null ? <DocumentNotFound /> : <DocumentBody certificate={certificate} />;
};
