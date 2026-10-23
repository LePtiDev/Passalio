import { describe, expect, it } from "vitest";
import type { EquipmentRecord } from "@/lib/db/local-records";
import {
  customerNameOf,
  dueStatusOf,
  equipmentNameOf,
  nextDueOf,
  singleActivityOf,
  routeUrlOf,
  tradeTagsOf,
} from "./customer-view";
import { equipmentDetailLine } from "./equipment-view";

const TODAY = new Date("2026-10-23T09:00:00");

const equipment = (changes: Partial<EquipmentRecord>): EquipmentRecord => ({
  id: "equipment-1",
  organizationId: "organization-a",
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  deletedAt: null,
  siteId: "site-1",
  kind: "insert",
  energy: "wood_logs",
  brand: null,
  model: null,
  serialNumber: null,
  powerKw: null,
  room: null,
  details: {},
  status: "active",
  isInstalledByUs: false,
  commissionedOn: null,
  installationYear: null,
  removedOn: null,
  replacedByEquipmentId: null,
  lastSweepingOn: null,
  lastServiceOn: null,
  nextDueDate: null,
  notes: null,
  ...changes,
});

describe("customer view", () => {
  it("classifies due dates", () => {
    expect(dueStatusOf("2026-10-22", TODAY)).toBe("overdue");
    expect(dueStatusOf("2026-11-20", TODAY)).toBe("near");
    expect(dueStatusOf("2027-01-10", TODAY)).toBe("later");
  });

  it("takes the earliest due date of active equipments", () => {
    expect(
      nextDueOf([
        equipment({ nextDueDate: "2027-02-01" }),
        equipment({ nextDueDate: "2026-12-01" }),
        equipment({ nextDueDate: "2026-11-01", status: "removed" }),
        equipment({ nextDueDate: null }),
      ]),
    ).toBe("2026-12-01");
  });

  it("names equipments with their energy and make", () => {
    expect(equipmentNameOf(equipment({ brand: "Supra", model: "Kantal" }))).toBe(
      "Insert bois · Supra Kantal",
    );
    expect(equipmentNameOf(equipment({ kind: "pellet_stove", energy: "pellets" }))).toBe(
      "Poêle à granulés",
    );
  });

  it("tags equipments with the trades that cover them", () => {
    expect(tradeTagsOf({ kind: "boiler" })).toEqual(["maintenance", "chimney_sweeping"]);
    expect(tradeTagsOf({ kind: "air_to_air_heat_pump" })).toEqual(["heat_pump"]);
  });

  it("shows the first name before the last name", () => {
    const person = { kind: "individual" as const, companyName: null };
    expect(customerNameOf({ ...person, firstName: "Martine", lastName: "Lefort" })).toBe(
      "Martine Lefort",
    );
    expect(customerNameOf({ ...person, firstName: null, lastName: "Lefort" })).toBe("Lefort");
  });

  it("builds an itinerary link", () => {
    expect(
      routeUrlOf({ address: "8 avenue de Paris", postalCode: "94300", city: "Vincennes" }),
    ).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=8%20avenue%20de%20Paris%2C%2094300%20Vincennes",
    );
  });
});

describe("single activity", () => {
  it("names the only activity due on an equipment", () => {
    expect(singleActivityOf({ kind: "open_fireplace" })).toBe("chimney_sweeping");
    expect(singleActivityOf({ kind: "air_to_water_heat_pump" })).toBe("maintenance");
    expect(singleActivityOf({ kind: "insert" })).toBeNull();
  });
});

describe("equipment detail line", () => {
  it("lists the room, the flue and the serial number", () => {
    expect(
      equipmentDetailLine(
        equipment({ room: "Salon", serialNumber: "2318", details: { flueType: "lined_masonry" } }),
        null,
      ),
    ).toBe("Salon · conduit maçonné tubé · n° 2318");
  });

  it("describes an installed heat pump", () => {
    expect(
      equipmentDetailLine(
        equipment({
          kind: "air_to_water_heat_pump",
          energy: null,
          isInstalledByUs: true,
          commissionedOn: "2026-10-22",
          details: { refrigerant: "R32", refrigerantChargeKg: 1.4 },
        }),
        null,
      ),
    ).toBe("Installée par nous le 22 oct. 2026 · R32, 1,40 kg");
  });

  it("explains a replacement", () => {
    expect(
      equipmentDetailLine(
        equipment({
          kind: "boiler",
          energy: "gas",
          room: "Cuisine",
          status: "removed",
          removedOn: "2026-10-22",
          details: { flueType: "sealed_concentric" },
        }),
        "air_to_water_heat_pump",
      ),
    ).toBe("Cuisine · retirée le 22 oct. 2026, remplacée par la pompe à chaleur");
  });

  it("agrees with a masculine equipment", () => {
    expect(
      equipmentDetailLine(
        equipment({ kind: "insert", status: "removed", removedOn: "2026-10-22" }),
        "pellet_stove",
      ),
    ).toBe("retiré le 22 oct. 2026, remplacé par le poêle à granulés");
  });
});
