import { useLiveQuery } from "dexie-react-hooks";
import type { LocalDatabase } from "@/lib/db/local-database";
import { useLocalSession } from "@/lib/db/local-database-context";
import { pendingEntityIds } from "@/lib/db/outbox";
import { draftValuesOf } from "../draft-store";
import { readIssuer } from "../issuer-store";
import { readSavedSignature } from "../signature-store";
import { isSealedEquipment } from "../swept-equipment";

const loadVisit = async (database: LocalDatabase, interventionId: string, userId: string) => {
  const intervention = await database.interventions.get(interventionId);
  if (intervention === undefined || intervention.status === "cancelled") {
    return null;
  }
  const [
    customer,
    site,
    equipments,
    documents,
    drafts,
    member,
    signer,
    issuer,
    pending,
    signature,
  ] = await Promise.all([
    database.customers.get(intervention.customerId),
    database.sites.get(intervention.siteId),
    database.equipments.bulkGet(intervention.equipmentIds),
    database.documents.where("interventionId").equals(interventionId).toArray(),
    database.certificateDrafts.where("interventionId").equals(interventionId).toArray(),
    database.members.get(userId),
    database.localSettings.get("signer"),
    readIssuer(database),
    pendingEntityIds(database),
    readSavedSignature(database, userId),
  ]);
  if (customer === undefined || site === undefined) {
    return null;
  }
  const present = equipments.filter((equipment) => equipment !== undefined);
  return {
    intervention,
    customer,
    site,
    equipments: present.filter((equipment) => !isSealedEquipment(equipment)),
    sealedEquipments: present.filter(isSealedEquipment),
    documents: documents.filter(({ deletedAt }) => deletedAt === null),
    drafts: new Map(drafts.map((draft) => [draft.equipmentId, draftValuesOf(draft)])),
    technicianName:
      signer?.key === "signer" && signer.userId === userId ? signer.name : (member?.name ?? ""),
    issuer,
    pendingIds: pending,
    savedSignature: signature,
  };
};

export type CertificateVisit = NonNullable<Awaited<ReturnType<typeof loadVisit>>>;

export const useCertificateVisit = (
  interventionId: string,
): CertificateVisit | null | undefined => {
  const { database, actor } = useLocalSession();
  return useLiveQuery(
    () => loadVisit(database, interventionId, actor.userId),
    [database, interventionId, actor.userId],
  );
};
