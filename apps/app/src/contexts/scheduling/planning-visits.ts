import { customerNameOf, equipmentNameOf } from "@/contexts/customers";
import type {
  CustomerRecord,
  DocumentRecord,
  EquipmentRecord,
  InterventionRecord,
  SiteRecord,
} from "@/lib/db/local-records";
import { minutesOf } from "./planning-layout";

export type PlanningVisit = {
  readonly id: string;
  readonly intervention: InterventionRecord;
  readonly customer: CustomerRecord | null;
  readonly site: SiteRecord | null;
  readonly customerName: string;
  readonly shortName: string;
  readonly equipmentNames: readonly string[];
  readonly startMinutes: number | null;
  readonly durationMinutes: number;
  readonly isDone: boolean;
  readonly isPending: boolean;
};

export type PlanningRecords = {
  readonly interventions: readonly InterventionRecord[];
  readonly customers: readonly CustomerRecord[];
  readonly sites: readonly SiteRecord[];
  readonly equipments: readonly EquipmentRecord[];
  readonly documents: readonly DocumentRecord[];
  readonly pending: ReadonlySet<string>;
};

const byId = <Row extends { readonly id: string }>(rows: readonly Row[]) =>
  new Map(rows.map((row) => [row.id, row]));

export const shortNameOf = (customer: CustomerRecord) => {
  const name = customerNameOf(customer);
  if (customer.kind === "company" || customer.firstName === null || customer.lastName === null) {
    return name;
  }
  return `${customer.firstName.charAt(0).toUpperCase()}. ${customer.lastName}`;
};

const isFullySigned = (intervention: InterventionRecord, signedEquipmentIds: ReadonlySet<string>) =>
  intervention.equipmentIds.length > 0 &&
  intervention.equipmentIds.every((equipmentId) => signedEquipmentIds.has(equipmentId));

const signedEquipmentsByIntervention = (documents: readonly DocumentRecord[]) =>
  documents.reduce((signed, { interventionId, equipmentId }) => {
    signed.set(interventionId, new Set([...(signed.get(interventionId) ?? []), equipmentId]));
    return signed;
  }, new Map<string, Set<string>>());

const byStartTime = (left: PlanningVisit, right: PlanningVisit) =>
  (left.startMinutes ?? -1) - (right.startMinutes ?? -1) ||
  left.customerName.localeCompare(right.customerName, "fr-FR");

export const visitsOf = (records: PlanningRecords): readonly PlanningVisit[] => {
  const customers = byId(records.customers);
  const sites = byId(records.sites);
  const equipments = byId(records.equipments);
  const signed = signedEquipmentsByIntervention(records.documents);
  return records.interventions
    .filter(({ status }) => status !== "cancelled")
    .map((intervention) => {
      const customer = customers.get(intervention.customerId) ?? null;
      const customerName = customer === null ? "" : customerNameOf(customer);
      return {
        id: intervention.id,
        intervention,
        customer,
        site: sites.get(intervention.siteId) ?? null,
        customerName,
        shortName: customer === null ? "" : shortNameOf(customer),
        equipmentNames: intervention.equipmentIds.flatMap((equipmentId) => {
          const equipment = equipments.get(equipmentId);
          return equipment === undefined ? [] : [equipmentNameOf(equipment)];
        }),
        startMinutes: intervention.startTime === null ? null : minutesOf(intervention.startTime),
        durationMinutes: intervention.durationMinutes,
        isDone:
          intervention.status === "completed" ||
          isFullySigned(intervention, signed.get(intervention.id) ?? new Set()),
        isPending: records.pending.has(intervention.id),
      };
    })
    .toSorted(byStartTime);
};

export const totalAnnouncedCents = (visits: readonly PlanningVisit[]) =>
  visits.reduce((total, { intervention }) => total + (intervention.announcedPriceCents ?? 0), 0);

export type NextVisit =
  | { readonly kind: "none" }
  | { readonly kind: "finished" }
  | { readonly kind: "now"; readonly visit: PlanningVisit }
  | { readonly kind: "later"; readonly visit: PlanningVisit };

export const nextVisitOf = (
  visits: readonly PlanningVisit[],
  nowMinutes: number | null,
): NextVisit => {
  if (visits.length === 0) {
    return { kind: "none" };
  }
  const upcoming = visits.find(
    ({ isDone, startMinutes, durationMinutes }) =>
      !isDone &&
      (nowMinutes === null || startMinutes === null || startMinutes + durationMinutes > nowMinutes),
  );
  if (upcoming === undefined) {
    return { kind: "finished" };
  }
  const isNow =
    nowMinutes !== null && upcoming.startMinutes !== null && upcoming.startMinutes <= nowMinutes;
  return { kind: isNow ? "now" : "later", visit: upcoming };
};
