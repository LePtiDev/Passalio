import { zodResolver } from "@hookform/resolvers/zod";
import { parisDay } from "@passalio/shared";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { equipmentNameOf } from "@/contexts/customers";
import { useLocalSession } from "@/lib/db/local-database-context";
import type { EquipmentRecord } from "@/lib/db/local-records";
import {
  certificateFormSchema,
  initialFormValues,
  type CertificateFormValues,
} from "../../certificate-form";
import { isEquipmentSigned, nextEquipmentIdOf } from "../../certificate-steps";
import { saveDraft } from "../../draft-store";
import { complianceFr } from "../../fr";
import { useCertificateVisit, type CertificateVisit } from "../../hooks/use-certificate-visit";
import { visitHeadingOf } from "../../visit-heading";
import { CertificatePage } from "../certificate-page";
import {
  AlreadySigned,
  CertificateNotFound,
  CertificateSkeleton,
  SealedNotice,
} from "../visit-states";
import { AnomaliesSection } from "./anomalies-section";
import { DatesSection } from "./dates-section";
import { EquipmentSummary } from "./equipment-summary";
import { FlueSection } from "./flue-section";
import { ResultSection } from "./result-section";

const text = complianceFr.form;

const CertificateForm = ({
  visit,
  equipment,
}: {
  readonly visit: CertificateVisit;
  readonly equipment: EquipmentRecord;
}) => {
  const { database } = useLocalSession();
  const navigate = useNavigate();
  const [today] = useState(() => parisDay(new Date()));
  const interventionId = visit.intervention.id;
  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema(today)),
    defaultValues:
      visit.drafts.get(equipment.id) ?? initialFormValues(equipment, visit.intervention, today),
  });
  const heading = visitHeadingOf(visit);
  const trail = useMemo(
    () => [{ label: text.planning }, { label: heading.name }, { label: text.trail }],
    [heading.name],
  );
  const cancel = useCallback(() => {
    void navigate({ to: "/passages/$interventionId", params: { interventionId } });
  }, [navigate, interventionId]);
  const equipmentId = equipment.id;
  const save = useCallback(
    async (values: CertificateFormValues) => {
      try {
        await saveDraft(database, { interventionId, equipmentId }, values, new Date());
      } catch {
        toast.error(text.saveFailed);
        return;
      }
      const nextId = nextEquipmentIdOf(visit, equipmentId);
      await (nextId === null
        ? navigate({ to: "/passages/$interventionId/signature", params: { interventionId } })
        : navigate({
            to: "/passages/$interventionId/certificat/$equipmentId",
            params: { interventionId, equipmentId: nextId },
          }));
    },
    [database, interventionId, equipmentId, visit, navigate],
  );
  const { handleSubmit } = form;
  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      void handleSubmit(save)(event);
    },
    [handleSubmit, save],
  );
  return (
    <CertificatePage
      interventionId={interventionId}
      title={text.title}
      subtitle={heading.subtitle}
      desktopSubtitle={heading.desktopSubtitle}
      trail={trail}
      stepLabel={equipmentNameOf(equipment)}
      step={1}
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
            {text.cancel}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {text.continue}
          </Button>
        </>
      }
    >
      <EquipmentSummary equipment={equipment} customerId={visit.customer.id} />
      <FlueSection form={form} />
      <ResultSection form={form} />
      <AnomaliesSection form={form} />
      <DatesSection form={form} today={today} />
    </CertificatePage>
  );
};

export const CertificateFormScreen = ({
  interventionId,
  equipmentId,
}: {
  readonly interventionId: string;
  readonly equipmentId: string;
}) => {
  const visit = useCertificateVisit(interventionId);
  if (visit === undefined) {
    return <CertificateSkeleton />;
  }
  if (visit === null) {
    return <CertificateNotFound />;
  }
  const equipment = visit.equipments.find(({ id }) => id === equipmentId);
  if (equipment === undefined) {
    return visit.sealedEquipments.some(({ id }) => id === equipmentId) ? (
      <SealedNotice interventionId={interventionId} />
    ) : (
      <CertificateNotFound />
    );
  }
  if (isEquipmentSigned(visit, equipmentId)) {
    return <AlreadySigned interventionId={interventionId} />;
  }
  return <CertificateForm key={equipmentId} visit={visit} equipment={equipment} />;
};
