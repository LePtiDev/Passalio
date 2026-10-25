import { PenLine } from "lucide-react";
import { useCallback, useMemo, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { complianceFr } from "../../fr";
import { useCertificateVisit, type CertificateVisit } from "../../hooks/use-certificate-visit";
import { useSignVisit } from "../../hooks/use-sign-visit";
import { CertificatePage } from "../certificate-page";
import { unsignedEquipmentsOf } from "../../certificate-steps";
import { visitHeadingOf } from "../../visit-heading";
import { AlreadySigned, CertificateNotFound, CertificateSkeleton } from "../visit-states";
import { CertificateList } from "./certificate-list";
import { LegalSheet } from "./legal-sheet";
import { SignaturesSection } from "./signatures-section";

const text = complianceFr.sign;

const SignForm = ({ visit }: { readonly visit: CertificateVisit }) => {
  const navigate = useNavigate();
  const signing = useSignVisit(visit);
  const { sign, signAfterLegalSaved } = signing;
  const heading = visitHeadingOf(visit);
  const interventionId = visit.intervention.id;
  const trail = useMemo(
    () => [{ label: complianceFr.form.planning }, { label: heading.name }, { label: text.trail }],
    [heading.name],
  );
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sign();
    },
    [sign],
  );
  const cancel = useCallback(() => {
    void navigate({ to: "/passages/$interventionId", params: { interventionId } });
  }, [navigate, interventionId]);
  const signAfterSave = useCallback(() => {
    void signAfterLegalSaved();
  }, [signAfterLegalSaved]);
  const count = signing.equipments.length;
  return (
    <>
      <CertificatePage
        interventionId={interventionId}
        title={text.title}
        subtitle={heading.subtitle}
        desktopSubtitle={heading.desktopSubtitle}
        trail={trail}
        stepLabel={text.stepTitle}
        step={2}
        note={text.note}
        onSubmit={submit}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={cancel}
              className="hidden lg:inline-flex"
            >
              {complianceFr.form.cancel}
            </Button>
            <Button type="submit" disabled={signing.isSigning}>
              <PenLine aria-hidden="true" />
              {signing.isSigning ? text.signing : count > 1 ? text.submitMany(count) : text.submit}
            </Button>
          </>
        }
      >
        <CertificateList
          interventionId={interventionId}
          equipments={signing.equipments}
          drafts={visit.drafts}
          error={signing.issues.certificates}
        />
        <SignaturesSection
          visit={visit}
          signatures={signing.signatures}
          issues={signing.issues}
          onChange={signing.setSignatures}
        />
      </CertificatePage>
      <LegalSheet
        isOpen={signing.isLegalSheetOpen}
        isWaiting={signing.isAwaitingIssuer}
        onClose={signing.closeLegalSheet}
        onSaved={signAfterSave}
      />
    </>
  );
};

export const SignScreen = ({ interventionId }: { readonly interventionId: string }) => {
  const visit = useCertificateVisit(interventionId);
  if (visit === undefined) {
    return <CertificateSkeleton />;
  }
  if (visit === null || visit.equipments.length === 0) {
    return <CertificateNotFound />;
  }
  return unsignedEquipmentsOf(visit).length > 0 ? (
    <SignForm visit={visit} />
  ) : (
    <AlreadySigned interventionId={interventionId} />
  );
};
