import { documentNumberLabel } from "@passalio/shared";
import type { DocumentRecord, EquipmentRecord } from "@/lib/db/local-records";
import { formatCalendarDate } from "./customer-view";
import { customersFr } from "./fr";

const text = customersFr.file;

export type CertificateHistoryItem = {
  readonly id: string;
  readonly number: string;
  readonly equipmentName: string;
  readonly signedOn: string;
  readonly technicianName: string | null;
  readonly correctedByNumber: string | null;
  readonly isCancelled: boolean;
};

const technicianNameOf = (document: DocumentRecord) => {
  const technician = document.data["technician"];
  return typeof technician === "object" &&
    technician !== null &&
    "name" in technician &&
    typeof technician.name === "string"
    ? technician.name
    : null;
};

const numberOf = (document: DocumentRecord) =>
  documentNumberLabel(document.numberPrefix, document.number);

export const certificateHistoryOf = (
  documents: readonly DocumentRecord[],
  equipments: readonly EquipmentRecord[],
): readonly CertificateHistoryItem[] => {
  const equipmentsById = new Map(equipments.map((equipment) => [equipment.id, equipment]));
  const corrections = new Map(
    documents.flatMap((document) =>
      document.cancelsDocumentId === null ? [] : [[document.cancelsDocumentId, document] as const],
    ),
  );
  return documents
    .filter(({ deletedAt }) => deletedAt === null)
    .toSorted(
      (left, right) => right.signedAt.localeCompare(left.signedAt) || right.number - left.number,
    )
    .map((document) => {
      const equipment = equipmentsById.get(document.equipmentId);
      const correction = corrections.get(document.id);
      return {
        id: document.id,
        number: numberOf(document),
        equipmentName:
          equipment === undefined
            ? text.historyUnknownEquipment
            : customersFr.equipmentName(equipment.kind, equipment.energy),
        signedOn: formatCalendarDate(document.completedOn),
        technicianName: technicianNameOf(document),
        correctedByNumber: correction === undefined ? null : numberOf(correction),
        isCancelled: correction !== undefined,
      };
    });
};
