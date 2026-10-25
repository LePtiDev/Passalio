import { newId, parisDay } from "@passalio/shared";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocalSession } from "@/lib/db/local-database-context";
import { certificateBodyOf } from "../certificate-body";
import { unsignedEquipmentsOf } from "../certificate-steps";
import { complianceFr } from "../fr";
import { ISSUER_WAIT_MS, whenCompanyKnown } from "../issuer-ready";
import { hasSignIssues, signIssuesOf, type SignaturesState } from "../sign-issues";
import { signCertificates, type SignCertificateError } from "../sign-certificate";
import { saveSignature } from "../signature-store";
import type { CertificateVisit } from "./use-certificate-visit";

const text = complianceFr.sign;

const failureOf = (error: SignCertificateError) =>
  error === "issuer_missing" ||
  error === "no_number_available" ||
  error === "legal_mentions_missing"
    ? text.failures[error]
    : text.failures.invalid;

const pendingCertificatesOf = (visit: CertificateVisit) =>
  unsignedEquipmentsOf(visit).map((equipment) => ({
    equipment,
    values: visit.drafts.get(equipment.id),
  }));

export const useSignVisit = (visit: CertificateVisit) => {
  const { database, actor } = useLocalSession();
  const navigate = useNavigate();
  const [signatures, setSignatures] = useState<SignaturesState>(() => ({
    technicianSignature: visit.savedSignature,
    customerSignature: null,
    isCustomerAbsent: false,
  }));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isLegalSheetOpen, setIsLegalSheetOpen] = useState(false);
  const [isAwaitingIssuer, setIsAwaitingIssuer] = useState(false);
  const pending = useMemo(() => pendingCertificatesOf(visit), [visit]);
  const equipments = useMemo(() => pending.map(({ equipment }) => equipment), [pending]);
  const issues = signIssuesOf(signatures, {
    hasEveryDraft: pending.every(({ values }) => values !== undefined),
  });
  const interventionId = visit.intervention.id;

  const sign = useCallback(async () => {
    setIsSubmitted(true);
    const technicianSignature = signatures.technicianSignature;
    if (hasSignIssues(issues) || technicianSignature === null) {
      return;
    }
    setIsSigning(true);
    const signedAt = new Date();
    const certificates = pending.flatMap(({ equipment, values }) =>
      values === undefined
        ? []
        : [
            {
              documentId: newId(),
              equipment,
              body: certificateBodyOf(
                values,
                {
                  customer: visit.customer,
                  site: visit.site,
                  equipment,
                  technicianName: visit.technicianName,
                },
                {
                  technicianSignature,
                  customerSignature: signatures.isCustomerAbsent
                    ? null
                    : signatures.customerSignature,
                  completedOn: parisDay(signedAt),
                },
              ),
            },
          ],
    );
    const signed = await signCertificates(database, {
      organizationId: actor.organizationId,
      userId: actor.userId,
      interventionId,
      signedAt,
      certificates,
    });
    setIsSigning(false);
    if (!signed.isOk) {
      if (signed.error === "legal_mentions_missing") {
        setIsLegalSheetOpen(true);
        return;
      }
      toast.error(failureOf(signed.error));
      return;
    }
    await saveSignature(database, actor.userId, technicianSignature);
    toast.success(
      signed.value.length === 1
        ? complianceFr.signed.toast
        : complianceFr.signed.toastMany(signed.value.length),
    );
    await navigate({
      to: "/passages/$interventionId/certificats-signes",
      params: { interventionId },
    });
  }, [signatures, issues, pending, visit, database, actor, interventionId, navigate]);

  const closeLegalSheet = useCallback(() => {
    setIsAwaitingIssuer(false);
    setIsLegalSheetOpen(false);
  }, []);

  const signAfterLegalSaved = useCallback(async () => {
    setIsAwaitingIssuer(true);
    const isKnown = await whenCompanyKnown(database, ISSUER_WAIT_MS);
    setIsAwaitingIssuer(false);
    setIsLegalSheetOpen(false);
    if (isKnown) {
      await sign();
      return;
    }
    toast.error(complianceFr.legal.waitFailed);
  }, [database, sign]);

  return {
    signatures,
    setSignatures,
    issues: isSubmitted ? issues : {},
    equipments,
    isSigning,
    isLegalSheetOpen,
    isAwaitingIssuer,
    closeLegalSheet,
    signAfterLegalSaved,
    sign,
  };
};
