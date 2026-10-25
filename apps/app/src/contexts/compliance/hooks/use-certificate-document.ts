import { useLiveQuery } from "dexie-react-hooks";
import type { LocalDatabase } from "@/lib/db/local-database";
import { useLocalSession } from "@/lib/db/local-database-context";
import { pendingEntityIds } from "@/lib/db/outbox";

const loadDocument = async (database: LocalDatabase, documentId: string) => {
  const document = await database.documents.get(documentId);
  if (document === undefined || document.deletedAt !== null) {
    return null;
  }
  const [intervention, equipment, sameEquipment, pending] = await Promise.all([
    database.interventions.get(document.interventionId),
    database.equipments.get(document.equipmentId),
    database.documents.where("equipmentId").equals(document.equipmentId).toArray(),
    pendingEntityIds(database),
  ]);
  const customer =
    intervention === undefined ? undefined : await database.customers.get(intervention.customerId);
  const live = sameEquipment.filter(({ deletedAt }) => deletedAt === null);
  return {
    document,
    customer,
    equipment,
    correctedBy: live.find(({ cancelsDocumentId }) => cancelsDocumentId === document.id),
    corrects: live.find(({ id }) => id === document.cancelsDocumentId),
    isPending: pending.has(document.id),
  };
};

export type CertificateDocument = NonNullable<Awaited<ReturnType<typeof loadDocument>>>;

export const useCertificateDocument = (
  documentId: string,
): CertificateDocument | null | undefined => {
  const { database } = useLocalSession();
  return useLiveQuery(() => loadDocument(database, documentId), [database, documentId]);
};
