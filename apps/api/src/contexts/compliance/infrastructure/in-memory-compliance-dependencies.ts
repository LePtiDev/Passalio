import type { ChangeCursor } from "@passalio/shared";
import type {
  ComplianceDependencies,
  SigningEquipment,
  SigningIntervention,
} from "../domain/compliance-ports";
import type {
  EquipmentSweepingUpdate,
  NumberBlock,
  SignedDocument,
} from "../domain/document-models";

type NumberingCounter = {
  readonly numberPrefix: string;
  readonly nextDocumentNumber: number;
};

type OwnedBy<T> = T & { readonly organizationId: string };

export type InMemoryComplianceState = {
  readonly documents: SignedDocument[];
  readonly equipmentUpdates: EquipmentSweepingUpdate[];
  readonly numberBlocks: NumberBlock[];
  readonly numbering: Map<string, NumberingCounter>;
  readonly interventions: Map<string, OwnedBy<SigningIntervention>>;
  readonly equipments: Map<string, OwnedBy<SigningEquipment>>;
};

export const createInMemoryComplianceState = (): InMemoryComplianceState => ({
  documents: [],
  equipmentUpdates: [],
  numberBlocks: [],
  numbering: new Map(),
  interventions: new Map(),
  equipments: new Map(),
});

const isAfter = (document: SignedDocument, after: ChangeCursor | undefined) =>
  after === undefined ||
  document.updatedAt > after.updatedAt ||
  (document.updatedAt.getTime() === after.updatedAt.getTime() && document.id > after.id);

const pageOf = (
  documents: readonly SignedDocument[],
  after: ChangeCursor | undefined,
  limit: number,
) =>
  documents
    .filter((document) => isAfter(document, after))
    .toSorted(
      (left, right) =>
        left.updatedAt.getTime() - right.updatedAt.getTime() || left.id.localeCompare(right.id),
    )
    .slice(0, limit)
    .map((document) => ({ ...document, deletedAt: null }));

const ownedIn = <T>(
  items: ReadonlyMap<string, OwnedBy<T>>,
  organizationId: string,
  id: string,
): OwnedBy<T> | undefined => {
  const item = items.get(id);
  return item?.organizationId === organizationId ? item : undefined;
};

export const createInMemoryComplianceDependencies = (
  state: InMemoryComplianceState,
  now: () => Date = () => new Date(),
): ComplianceDependencies => {
  const documentsOf = (organizationId: string) =>
    state.documents.filter((document) => document.organizationId === organizationId);
  return {
    documents: {
      exists: async (id) => state.documents.some((document) => document.id === id),
      findById: async (organizationId, documentId) =>
        documentsOf(organizationId).find((document) => document.id === documentId),
      isNumberTaken: async (organizationId, number) =>
        documentsOf(organizationId).some((document) => document.number === number),
      isCancelled: async (organizationId, documentId) =>
        documentsOf(organizationId).some((document) => document.cancelsDocumentId === documentId),
      sign: async (document, equipment) => {
        state.documents.push(document);
        state.equipmentUpdates.push(equipment);
        const current = state.equipments.get(equipment.equipmentId);
        if (current !== undefined) {
          state.equipments.set(equipment.equipmentId, {
            ...current,
            lastSweepingOn: equipment.lastSweepingOn,
          });
        }
      },
      changesAfter: async (organizationId, after, limit) =>
        pageOf(documentsOf(organizationId), after, limit),
      changesSignedBy: (userId) => async (organizationId, after, limit) =>
        pageOf(
          documentsOf(organizationId).filter((document) => document.signedByUserId === userId),
          after,
          limit,
        ),
    },
    numberBlocks: {
      reserve: async ({ id, organizationId, userId, deviceId, size, at }) => {
        const counter = state.numbering.get(organizationId);
        if (counter === undefined) {
          throw new Error("number_block_not_reserved");
        }
        state.numbering.set(organizationId, {
          ...counter,
          nextDocumentNumber: counter.nextDocumentNumber + size,
        });
        const block: NumberBlock = {
          id,
          organizationId,
          userId,
          deviceId,
          numberPrefix: counter.numberPrefix,
          firstNumber: counter.nextDocumentNumber,
          lastNumber: counter.nextDocumentNumber + size - 1,
          createdAt: at,
        };
        state.numberBlocks.push(block);
        return block;
      },
      findCovering: async (organizationId, userId, number) =>
        state.numberBlocks.find(
          (block) =>
            block.organizationId === organizationId &&
            block.userId === userId &&
            block.firstNumber <= number &&
            number <= block.lastNumber,
        ),
    },
    targets: {
      interventionOf: async (organizationId, interventionId) =>
        ownedIn(state.interventions, organizationId, interventionId),
      equipmentOf: async (organizationId, equipmentId) =>
        ownedIn(state.equipments, organizationId, equipmentId),
    },
    now,
  };
};
