import type { ServiceLine } from "@passalio/shared";
import {
  DAY_MINUTES,
  MAX_SERVICE_DAYS,
  MAX_VISIT_DURATION_MINUTES,
  MIN_VISIT_DURATION_MINUTES,
  tradesOfKind,
  VISIT_DURATION_STEP_MINUTES,
  visitMinutesOfService,
  type EquipmentKind,
} from "@passalio/trades";
import type { ServiceRecord } from "@/lib/db/local-records";

export const DURATION_CHOICES: readonly number[] = Array.from(
  {
    length:
      (MAX_VISIT_DURATION_MINUTES - MIN_VISIT_DURATION_MINUTES) / VISIT_DURATION_STEP_MINUTES + 1,
  },
  (_, index) => MIN_VISIT_DURATION_MINUTES + index * VISIT_DURATION_STEP_MINUTES,
);

export const SERVICE_DURATION_CHOICES: readonly number[] = [
  ...DURATION_CHOICES,
  ...Array.from({ length: MAX_SERVICE_DAYS }, (_, index) => (index + 1) * DAY_MINUTES),
];

export const suggestedServiceIds = (
  offered: readonly ServiceRecord[],
  equipmentKinds: readonly EquipmentKind[],
): string[] => {
  const isOffered = (trade: string) => offered.some((service) => service.trade === trade);
  const needed = new Set(
    equipmentKinds.flatMap((kind) => tradesOfKind(kind).find(isOffered) ?? []),
  );
  const firstByTrade = offered.filter(
    (service, index) =>
      service.trade !== null &&
      needed.has(service.trade) &&
      offered.findIndex(({ trade }) => trade === service.trade) === index,
  );
  const [only] = offered;
  return firstByTrade.length === 0 && offered.length === 1 && only !== undefined
    ? [only.id]
    : firstByTrade.map(({ id }) => id);
};

export const chosenServices = (
  offered: readonly ServiceRecord[],
  serviceIds: readonly string[],
): ServiceRecord[] => offered.filter(({ id }) => serviceIds.includes(id));

export const usualMinutesOf = (chosen: readonly ServiceRecord[]) =>
  chosen.reduce((total, { durationMinutes }) => total + visitMinutesOfService(durationMinutes), 0);

export const usualDurationOf = (chosen: readonly ServiceRecord[]) =>
  Math.min(usualMinutesOf(chosen), MAX_VISIT_DURATION_MINUTES);

export const usualPriceCentsOf = (chosen: readonly ServiceRecord[]): number | null => {
  const priced = chosen.flatMap(({ priceCents }) => (priceCents === null ? [] : [priceCents]));
  return priced.length === 0 ? null : priced.reduce((total, cents) => total + cents, 0);
};

export const toggledServiceId = (
  offered: readonly ServiceRecord[],
  serviceIds: readonly string[],
  serviceId: string,
): string[] =>
  serviceIds.includes(serviceId)
    ? serviceIds.filter((chosen) => chosen !== serviceId)
    : offered
        .map(({ id }) => id)
        .filter((candidate) => candidate === serviceId || serviceIds.includes(candidate));

export const serviceLinesOf = (chosen: readonly ServiceRecord[]): ServiceLine[] =>
  chosen.map(({ id, name, durationMinutes, priceCents }) => ({
    serviceId: id,
    name,
    durationMinutes,
    priceCents,
  }));

export const visitTypesOf = (chosen: readonly ServiceRecord[]) => [
  ...new Set(chosen.flatMap(({ trade }) => (trade === null ? [] : [trade]))),
];
