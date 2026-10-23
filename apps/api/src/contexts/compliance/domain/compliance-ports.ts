import type { ChangesAfter, InterventionStatus } from "@passalio/shared";
import type { SweptEquipment } from "@passalio/trades";
import type { EquipmentSweepingUpdate, NumberBlock, SignedDocument } from "./document-models";

export type DocumentRepository = {
  readonly exists: (id: string) => Promise<boolean>;
  readonly findById: (
    organizationId: string,
    documentId: string,
  ) => Promise<SignedDocument | undefined>;
  readonly isNumberTaken: (organizationId: string, number: number) => Promise<boolean>;
  readonly isCancelled: (organizationId: string, documentId: string) => Promise<boolean>;
  readonly sign: (document: SignedDocument, equipment: EquipmentSweepingUpdate) => Promise<void>;
  readonly changesAfter: ChangesAfter<SignedDocument>;
  readonly changesSignedBy: (userId: string) => ChangesAfter<SignedDocument>;
};

export type NumberBlockRequest = {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly size: number;
  readonly at: Date;
};

export type NumberBlockRepository = {
  readonly reserve: (request: NumberBlockRequest) => Promise<NumberBlock>;
  readonly findCovering: (
    organizationId: string,
    userId: string,
    number: number,
  ) => Promise<NumberBlock | undefined>;
};

export type SigningIntervention = {
  readonly status: InterventionStatus;
  readonly equipmentIds: readonly string[];
};

export type SigningEquipment = SweptEquipment & {
  readonly lastSweepingOn: string | null;
};

export type SigningTargets = {
  readonly interventionOf: (
    organizationId: string,
    interventionId: string,
  ) => Promise<SigningIntervention | undefined>;
  readonly equipmentOf: (
    organizationId: string,
    equipmentId: string,
  ) => Promise<SigningEquipment | undefined>;
};

export type ComplianceDependencies = {
  readonly documents: DocumentRepository;
  readonly numberBlocks: NumberBlockRepository;
  readonly targets: SigningTargets;
  readonly now: () => Date;
};
