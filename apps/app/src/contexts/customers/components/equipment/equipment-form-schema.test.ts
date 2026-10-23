import { describe, expect, it } from "vitest";
import {
  emptyEquipmentForm,
  equipmentFormSchema,
  replacedEquipmentIdOf,
  toEquipmentFields,
  type EquipmentFormValues,
} from "./equipment-form-schema";

const form = (changes: Partial<EquipmentFormValues>): EquipmentFormValues => ({
  ...emptyEquipmentForm(undefined),
  ...changes,
});

describe("equipment form", () => {
  it("requires a kind", () => {
    const result = equipmentFormSchema.safeParse(form({}));
    expect(result.success).toBe(false);
    expect(result.error?.issues.map(({ path }) => path.join("."))).toEqual(["kind"]);
  });

  it("keeps flue details and the installation year for an insert already in place", () => {
    const fields = toEquipmentFields(
      form({
        kind: "insert",
        energy: "wood_logs",
        brand: " Supra ",
        room: "Salon",
        flueType: "lined_masonry",
        installationYear: "2019",
        commissionedOn: "2026-10-22",
        lastSweepingOn: "2025-11-04",
        refrigerant: "R32",
      }),
    );
    expect(fields).toMatchObject({
      kind: "insert",
      energy: "wood_logs",
      brand: "Supra",
      model: null,
      details: { flueType: "lined_masonry" },
      isInstalledByUs: false,
      installationYear: 2019,
      commissionedOn: null,
      lastSweepingOn: "2025-11-04",
    });
  });

  it("keeps heat pump details and drops the energy and the sweeping date", () => {
    const fields = toEquipmentFields(
      form({
        kind: "air_to_water_heat_pump",
        energy: "gas",
        powerKw: "8",
        refrigerant: "r32",
        refrigerantCharge: "1,4",
        outdoorUnitLocation: "Jardin",
        flueType: "metal",
        isInstalledByUs: true,
        commissionedOn: "2026-10-22",
        installationYear: "2001",
        lastSweepingOn: "2025-01-01",
      }),
    );
    expect(fields).toMatchObject({
      energy: null,
      powerKw: 8,
      details: { refrigerant: "R32", refrigerantChargeKg: 1.4, outdoorUnitLocation: "Jardin" },
      commissionedOn: "2026-10-22",
      installationYear: null,
      lastSweepingOn: null,
    });
  });

  it("drops the last visit of an equipment we installed", () => {
    const fields = toEquipmentFields(
      form({
        kind: "pellet_stove",
        energy: "pellets",
        isInstalledByUs: true,
        commissionedOn: "2026-10-22",
        lastSweepingOn: "2025-01-01",
        lastServiceOn: "2025-02-01",
      }),
    );
    expect(fields).toMatchObject({ lastSweepingOn: null, lastServiceOn: null });
  });

  it("rejects an invalid year and refrigerant", () => {
    const result = equipmentFormSchema.safeParse(
      form({ kind: "air_conditioner", installationYear: "19", refrigerant: "gaz" }),
    );
    expect(result.error?.issues.map(({ path }) => path.join("."))).toEqual([
      "installationYear",
      "refrigerant",
    ]);
  });

  it("replaces an equipment only when it is installed by us", () => {
    const replacing = emptyEquipmentForm("equipment-1");
    expect(replacing.isInstalledByUs).toBe(true);
    expect(replacedEquipmentIdOf(replacing)).toBe("equipment-1");
    expect(replacedEquipmentIdOf({ ...replacing, isInstalledByUs: false })).toBeUndefined();
    expect(replacedEquipmentIdOf(emptyEquipmentForm(undefined))).toBeUndefined();
  });
});
