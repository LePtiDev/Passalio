import { Link } from "@tanstack/react-router";
import { FilePenLine } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useCan } from "@/lib/permissions/use-can";
import { certificateEntryOf, type CertificateEntry } from "../certificate-entry";
import { complianceFr } from "../fr";
import { useCertificateVisit } from "../hooks/use-certificate-visit";

const text = complianceFr.entry;

const EntryLink = ({
  interventionId,
  entry,
  className,
}: {
  readonly interventionId: string;
  readonly entry: NonNullable<CertificateEntry>;
  readonly className: string;
}) => {
  const equipmentId = entry.step === "form" ? entry.equipmentId : "";
  const visitParams = useMemo(() => ({ interventionId }), [interventionId]);
  const formParams = useMemo(
    () => ({ interventionId, equipmentId }),
    [interventionId, equipmentId],
  );
  const label = entry.step === "signed" ? text.view : text.fill;
  const content = (
    <>
      <FilePenLine aria-hidden="true" className="size-5 lg:size-3.5" />
      {label}
    </>
  );
  return (
    <Button
      asChild
      variant={entry.step === "signed" ? "secondary" : "primary"}
      className={className}
    >
      {entry.step === "form" ? (
        <Link to="/passages/$interventionId/certificat/$equipmentId" params={formParams}>
          {content}
        </Link>
      ) : (
        <Link
          to={
            entry.step === "sign"
              ? "/passages/$interventionId/signature"
              : "/passages/$interventionId/certificats-signes"
          }
          params={visitParams}
        >
          {content}
        </Link>
      )}
    </Button>
  );
};

export const FillCertificateButton = ({
  interventionId,
  className = "",
}: {
  readonly interventionId: string;
  readonly className?: string;
}) => {
  const visit = useCertificateVisit(interventionId);
  const canSign = useCan("documents:sign");
  const entry = visit === undefined || visit === null ? null : certificateEntryOf(visit);
  if (entry === null || (!canSign && entry.step !== "signed")) {
    return (
      <Button type="button" disabled className={className}>
        <FilePenLine aria-hidden="true" className="size-5 lg:size-3.5" />
        {text.fill}
      </Button>
    );
  }
  return <EntryLink interventionId={interventionId} entry={entry} className={className} />;
};
