import { requiresUsageAdvice } from "@passalio/trades";
import { customerNameOf, fullAddressOf } from "@/contexts/customers";
import type { CustomerRecord, EquipmentRecord, SiteRecord } from "@/lib/db/local-records";
import type { CertificateFormValues } from "./certificate-form";
import { ANOMALY_LABELS } from "./fr";
import type { CertificateBody } from "./sign-certificate";
import { sweptEquipmentOf } from "./swept-equipment";

export type CertificateParties = {
  readonly customer: CustomerRecord;
  readonly site: SiteRecord;
  readonly equipment: EquipmentRecord;
  readonly technicianName: string;
};

export type CertificateSignatures = {
  readonly technicianSignature: string;
  readonly customerSignature: string | null;
  readonly completedOn: string;
};

const textOrNull = (value: string) => (value.trim() === "" ? null : value.trim());

export const anomaliesTextOf = ({ anomalyKinds, anomalyDetails }: CertificateFormValues) => {
  const kinds = anomalyKinds
    .filter((kind) => kind !== "other")
    .map((kind) => ANOMALY_LABELS[kind])
    .join(", ");
  const details = anomalyDetails.trim();
  const parts = [kinds, details].filter((part) => part !== "");
  return parts.length === 0 ? null : parts.join(". ");
};

const customerAddressOf = (customer: CustomerRecord, site: SiteRecord) =>
  customer.billingAddress === null ||
  customer.billingPostalCode === null ||
  customer.billingCity === null
    ? fullAddressOf(site)
    : `${customer.billingAddress}, ${customer.billingPostalCode} ${customer.billingCity}`;

export const certificateEquipmentOf = (
  equipment: EquipmentRecord,
): CertificateBody["equipment"] => ({
  kind: equipment.kind,
  energy: equipment.energy,
  brand: equipment.brand,
  model: equipment.model,
  serialNumber: equipment.serialNumber,
  flueType: sweptEquipmentOf(equipment).flueType,
});

export const certificateBodyOf = (
  values: CertificateFormValues,
  { customer, site, equipment, technicianName }: CertificateParties,
  { technicianSignature, customerSignature, completedOn }: CertificateSignatures,
): CertificateBody => {
  const swept = sweptEquipmentOf(equipment);
  return {
    customer: { name: customerNameOf(customer), address: customerAddressOf(customer, site) },
    site: { address: fullAddressOf(site), room: equipment.room },
    equipment: certificateEquipmentOf(equipment),
    technician: { name: technicianName },
    flues: [{ designation: values.flueDesignation.trim() }],
    sweepingExtent: values.sweepingExtent,
    unsweptPart: values.sweepingExtent === "partial" ? textOrNull(values.unsweptPart) : null,
    isConnectionPipeSwept: values.isConnectionPipeSwept,
    chimneyStacks: values.chimneyStacks,
    anomalies: anomaliesTextOf(values),
    isDoNotUse: values.isDoNotUse,
    visitedOn: values.visitedOn,
    completedOn,
    lastSweepingOn: values.lastSweepingOn === "" ? null : values.lastSweepingOn,
    lastServiceOn: values.lastServiceOn === "" ? null : values.lastServiceOn,
    isAdviceAttached: requiresUsageAdvice(swept),
    technicianSignature,
    customerSignature,
    isCustomerAbsent: customerSignature === null,
  };
};
