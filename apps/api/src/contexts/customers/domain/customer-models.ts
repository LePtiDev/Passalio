import type {
  BuildingType,
  Civility,
  CustomerKind,
  EquipmentPhotoKind,
  EquipmentStatus,
} from "@passalio/shared";
import type { Energy, EquipmentDetails, EquipmentKind } from "@passalio/trades";

type Synced = {
  readonly id: string;
  readonly organizationId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type Customer = Synced & {
  readonly kind: CustomerKind;
  readonly civility: Civility | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly companyName: string | null;
  readonly searchName: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly secondaryPhone: string | null;
  readonly billingAddress: string | null;
  readonly billingPostalCode: string | null;
  readonly billingCity: string | null;
  readonly notes: string | null;
  readonly remindersOptedOutAt: Date | null;
  readonly createdByUserId: string;
};

export type Site = Synced & {
  readonly customerId: string;
  readonly label: string | null;
  readonly address: string;
  readonly addressDetails: string | null;
  readonly postalCode: string;
  readonly city: string;
  readonly buildingType: BuildingType;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly occupantName: string | null;
  readonly occupantPhone: string | null;
  readonly accessNotes: string | null;
};

export type Equipment = Synced & {
  readonly siteId: string;
  readonly kind: EquipmentKind;
  readonly energy: Energy | null;
  readonly brand: string | null;
  readonly model: string | null;
  readonly serialNumber: string | null;
  readonly powerKw: number | null;
  readonly room: string | null;
  readonly details: EquipmentDetails;
  readonly status: EquipmentStatus;
  readonly isInstalledByUs: boolean;
  readonly commissionedOn: string | null;
  readonly installationYear: number | null;
  readonly removedOn: string | null;
  readonly replacedByEquipmentId: string | null;
  readonly lastSweepingOn: string | null;
  readonly lastServiceOn: string | null;
  readonly nextDueDate: string | null;
  readonly notes: string | null;
};

export type EquipmentPhoto = Synced & {
  readonly equipmentId: string;
  readonly kind: EquipmentPhotoKind;
  readonly storageKey: string;
  readonly contentType: string;
  readonly takenAt: Date;
  readonly createdByUserId: string;
};

export type CustomerSummary = Pick<
  Customer,
  "id" | "kind" | "firstName" | "lastName" | "companyName" | "phone" | "email" | "updatedAt"
>;

export type CustomerFile = {
  readonly customer: Customer;
  readonly sites: readonly Site[];
  readonly equipments: readonly Equipment[];
  readonly photos: readonly Omit<EquipmentPhoto, "storageKey">[];
};
