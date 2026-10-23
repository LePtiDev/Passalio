import type { DocumentKind } from "@passalio/shared";
import type { TradeId } from "@passalio/trades";

export type SignedDocument = {
  readonly id: string;
  readonly organizationId: string;
  readonly interventionId: string;
  readonly equipmentId: string;
  readonly trade: TradeId;
  readonly kind: DocumentKind;
  readonly templateVersion: number;
  readonly number: number;
  readonly numberPrefix: string;
  readonly deviceId: string;
  readonly signedByUserId: string;
  readonly signedAt: Date;
  readonly completedOn: string;
  readonly cancelsDocumentId: string | null;
  readonly data: Readonly<Record<string, unknown>>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type NumberBlock = {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly numberPrefix: string;
  readonly firstNumber: number;
  readonly lastNumber: number;
  readonly createdAt: Date;
};

export type EquipmentSweepingUpdate = {
  readonly equipmentId: string;
  readonly lastSweepingOn: string;
  readonly nextDueDate: string;
  readonly updatedAt: Date;
};
