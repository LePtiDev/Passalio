import { calendarDateOf, displayNameOf } from "@passalio/shared";
import { tradesOfKind, type TradeId } from "@passalio/trades";
import type { CustomerRecord, EquipmentRecord, SiteRecord } from "@/lib/db/local-records";
import { formatShortDateWithYear } from "@/lib/format-date";
import { customersFr } from "./fr";

export const NEAR_DUE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export type DueStatus = "overdue" | "near" | "later";

export type TradeTag = keyof typeof customersFr.tradeTags;

const TAG_OF_TRADE: Readonly<Record<TradeId, TradeTag | null>> = {
  chimney_sweeping: "chimney_sweeping",
  stove_maintenance: "maintenance",
  boiler_maintenance: "maintenance",
  heat_pump_maintenance: "heat_pump",
  septic_tank_emptying: null,
};

export const calendarDate = (value: string) => new Date(`${value}T12:00:00`);

export const formatCalendarDate = (value: string) => formatShortDateWithYear(calendarDate(value));

export const formatTimestamp = (value: string) => formatShortDateWithYear(new Date(value));

export const dueStatusOf = (dueDate: string, today: Date): DueStatus => {
  const days = Math.round(
    (calendarDate(dueDate).getTime() - calendarDate(calendarDateOf(today)).getTime()) / DAY_MS,
  );
  if (days < 0) {
    return "overdue";
  }
  return days <= NEAR_DUE_DAYS ? "near" : "later";
};

export const nextDueOf = (equipments: readonly EquipmentRecord[]) =>
  equipments
    .filter(({ status }) => status === "active")
    .flatMap(({ nextDueDate }) => (nextDueDate === null ? [] : [nextDueDate]))
    .toSorted()
    .at(0) ?? null;

export const tradeTagsOf = (equipment: Pick<EquipmentRecord, "kind">): readonly TradeTag[] => [
  ...new Set(
    tradesOfKind(equipment.kind).flatMap((trade) => {
      const tag = TAG_OF_TRADE[trade];
      return tag === null ? [] : [tag];
    }),
  ),
];

export const equipmentNameOf = (
  equipment: Pick<EquipmentRecord, "kind" | "energy" | "brand" | "model">,
) => {
  const name = customersFr.equipmentName(equipment.kind, equipment.energy);
  const make = [equipment.brand, equipment.model].filter((part) => part !== null).join(" ");
  return make === "" ? name : `${name} · ${make}`;
};

export const customerNameOf = (
  customer: Pick<CustomerRecord, "kind" | "firstName" | "lastName" | "companyName">,
) =>
  customer.kind === "company"
    ? displayNameOf(customer)
    : [customer.firstName, customer.lastName].filter((part) => part !== null).join(" ");

export const fullAddressOf = (site: Pick<SiteRecord, "address" | "postalCode" | "city">) =>
  `${site.address}, ${site.postalCode} ${site.city}`;

export const routeUrlOf = (site: Pick<SiteRecord, "address" | "postalCode" | "city">) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddressOf(site))}`;
