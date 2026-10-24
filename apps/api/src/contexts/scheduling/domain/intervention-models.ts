import type { InterventionStatus, PaymentMethod, ServiceLine } from "@passalio/shared";
import type { TradeId } from "@passalio/trades";

export type Intervention = {
  readonly id: string;
  readonly organizationId: string;
  readonly customerId: string;
  readonly siteId: string;
  readonly technicianUserId: string;
  readonly technicianUserIds: readonly string[];
  readonly scheduledDate: string;
  readonly startTime: string | null;
  readonly durationMinutes: number;
  readonly visitTypes: readonly TradeId[];
  readonly serviceLines: readonly ServiceLine[];
  readonly equipmentIds: readonly string[];
  readonly announcedPriceCents: number | null;
  readonly notes: string | null;
  readonly status: InterventionStatus;
  readonly completedOn: string | null;
  readonly paymentMethod: PaymentMethod | null;
  readonly paidAmountCents: number | null;
  readonly createdByUserId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type InterventionChangeSet = {
  readonly [Key in keyof Omit<Intervention, "id" | "organizationId" | "createdAt">]?:
    | Intervention[Key]
    | undefined;
};
