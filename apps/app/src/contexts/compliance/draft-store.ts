import type { CertificateDraftRecord } from "@/lib/db/compliance-records";
import type { LocalDatabase } from "@/lib/db/local-database";
import { certificateFormValues, type CertificateFormValues } from "./certificate-form";

export const draftIdOf = (interventionId: string, equipmentId: string) =>
  `${interventionId}:${equipmentId}`;

export const saveDraft = (
  database: LocalDatabase,
  {
    interventionId,
    equipmentId,
  }: { readonly interventionId: string; readonly equipmentId: string },
  values: CertificateFormValues,
  at: Date,
) =>
  database.certificateDrafts.put({
    id: draftIdOf(interventionId, equipmentId),
    interventionId,
    equipmentId,
    values,
    updatedAt: at.toISOString(),
  });

export const draftValuesOf = (
  draft: Pick<CertificateDraftRecord, "values"> | undefined,
): CertificateFormValues | undefined => {
  const parsed = certificateFormValues.safeParse(draft?.values);
  return parsed.success ? parsed.data : undefined;
};
