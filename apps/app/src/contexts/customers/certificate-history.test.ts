import { describe, expect, it } from "vitest";
import type { EquipmentRecord } from "@/lib/db/local-records";
import { serverEquipmentRecord } from "@/lib/sync/sync-test-records";
import { signedCertificateDocument } from "@/test-support/certificate-visit";
import { certificateHistoryOf } from "./certificate-history";

const insert: EquipmentRecord = {
  ...serverEquipmentRecord("equipment-insert", "site-1"),
  kind: "insert",
  energy: "wood_logs",
};

const stove: EquipmentRecord = {
  ...serverEquipmentRecord("equipment-stove", "site-1"),
  kind: "pellet_stove",
  energy: "pellets",
};

describe("certificateHistoryOf", () => {
  it("lists the most recent certificates first, with their appliance, date and technician", () => {
    const history = certificateHistoryOf(
      [
        signedCertificateDocument({
          id: "old",
          number: 61,
          signedAt: "2026-03-14T09:00:00.000Z",
          completedOn: "2026-03-14",
        }),
        signedCertificateDocument({ id: "new", equipmentId: "equipment-stove", number: 143 }),
      ],
      [insert, stove],
    );

    expect(history).toStrictEqual([
      {
        id: "new",
        number: "RD-2026-0143",
        equipmentName: "Poêle à granulés",
        signedOn: "23 oct. 2026",
        technicianName: "Jean Dupont",
        correctedByNumber: null,
        isCancelled: false,
      },
      {
        id: "old",
        number: "RD-2026-0061",
        equipmentName: "Insert bois",
        signedOn: "14 mars 2026",
        technicianName: "Jean Dupont",
        correctedByNumber: null,
        isCancelled: false,
      },
    ]);
  });

  it("marks a certificate cancelled by a correction, with the number of the correction", () => {
    const history = certificateHistoryOf(
      [
        signedCertificateDocument({
          id: "wrong",
          number: 61,
          signedAt: "2026-03-14T09:00:00.000Z",
        }),
        signedCertificateDocument({
          id: "fixed",
          number: 62,
          signedAt: "2026-03-14T10:00:00.000Z",
          cancelsDocumentId: "wrong",
        }),
      ],
      [insert],
    );

    expect(
      history.map(({ id, isCancelled, correctedByNumber }) => ({
        id,
        isCancelled,
        correctedByNumber,
      })),
    ).toStrictEqual([
      { id: "fixed", isCancelled: false, correctedByNumber: null },
      { id: "wrong", isCancelled: true, correctedByNumber: "RD-2026-0062" },
    ]);
  });

  it("leaves out deleted certificates and names an appliance missing from this device", () => {
    const history = certificateHistoryOf(
      [
        signedCertificateDocument({ id: "deleted", deletedAt: "2026-10-24T08:00:00.000Z" }),
        signedCertificateDocument({ id: "unknown", equipmentId: "equipment-gone" }),
      ],
      [insert],
    );

    expect(history.map(({ id, equipmentName }) => ({ id, equipmentName }))).toStrictEqual([
      { id: "unknown", equipmentName: "Appareil" },
    ]);
  });

  it("keeps a certificate without technician name readable", () => {
    const [item] = certificateHistoryOf(
      [signedCertificateDocument({ data: { technician: null } })],
      [insert],
    );

    expect(item?.technicianName).toBeNull();
  });
});
