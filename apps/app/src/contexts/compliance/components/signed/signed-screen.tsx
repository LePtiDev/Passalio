import { nextSweepingDueDate } from "@passalio/trades";
import { BellRing, CircleCheck } from "lucide-react";
import { useMemo } from "react";
import { DesktopTopBar } from "@/components/app-shell/page-bars";
import { customerNameOf, formatCalendarDate, SyncPill } from "@/contexts/customers";
import { complianceFr } from "../../fr";
import { useCertificateVisit, type CertificateVisit } from "../../hooks/use-certificate-visit";
import { numberOf, signedAtLabel } from "../../signed-labels";
import { CertificateNotFound, CertificateSkeleton } from "../visit-states";
import { NextVisitRow } from "./next-visit-row";
import { SignedDocumentCard } from "./signed-document-card";

const text = complianceFr.signed;

const lastSignedOf = (visit: CertificateVisit) => {
  const latest = visit.documents.reduce<string | null>(
    (current, { signedAt }) => (current === null || signedAt > current ? signedAt : current),
    null,
  );
  return visit.documents.filter(({ signedAt }) => signedAt === latest);
};

const SignedBody = ({ visit }: { readonly visit: CertificateVisit }) => {
  const documents = lastSignedOf(visit);
  const name = customerNameOf(visit.customer);
  const trail = useMemo(
    () => [{ label: complianceFr.form.planning }, { label: name }, { label: text.trail }],
    [name],
  );
  const [first] = documents;
  if (first === undefined) {
    return <CertificateNotFound />;
  }
  const at = signedAtLabel(first.signedAt);
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#F7F9FB] pb-[100px] lg:bg-white lg:pb-0">
      <DesktopTopBar trail={trail}>
        <SyncPill />
      </DesktopTopBar>
      <div className="mx-auto flex w-full max-w-[600px] flex-col gap-5 p-4 pt-6 lg:max-w-[800px] lg:py-8">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#E6F4EE] lg:size-12">
          <CircleCheck aria-hidden="true" className="size-7 text-[#0E7C5A] lg:size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-[-0.015em] lg:text-xl">
            {documents.length === 1 ? text.title : text.titleMany(documents.length)}
          </h1>
          <p className="text-[15px] text-[#475569] lg:text-[13px]">
            {documents.length === 1
              ? text.subtitle(numberOf(first), name, at)
              : text.subtitleMany(name, at)}
          </p>
        </div>
        {documents.map((document) => (
          <SignedDocumentCard
            key={document.id}
            document={document}
            isPending={visit.pendingIds.has(document.id)}
          />
        ))}
        <p className="flex items-center gap-3 rounded-[12px] bg-[#E6F4EE] px-4 py-3 text-[15px] text-[#0B6349] lg:rounded-lg lg:text-[13px]">
          <BellRing aria-hidden="true" className="size-5 shrink-0 lg:size-4" />
          <span>
            {text.nextDuePrefix}{" "}
            <b className="font-bold">
              {formatCalendarDate(nextSweepingDueDate(first.completedOn))}
            </b>
            .
          </span>
        </p>
        <NextVisitRow current={visit.intervention} />
      </div>
    </div>
  );
};

export const SignedScreen = ({ interventionId }: { readonly interventionId: string }) => {
  const visit = useCertificateVisit(interventionId);
  if (visit === undefined) {
    return <CertificateSkeleton />;
  }
  return visit === null ? <CertificateNotFound /> : <SignedBody visit={visit} />;
};
