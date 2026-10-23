import { normalizeSearchText as sharedNormalize } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import { parseCsv, recordsOf } from "./csv.ts";
import { importedCompanyOf, normalizeSearchText, stableIdOf } from "./prospect-rows.ts";

const CSV = [
  "﻿Département;Entreprise;Ville;Adresse;Code postal;Dirigeant prénom;Dirigeant nom;Fonction;SIREN;Statut registre;Infos pour l'appel;Autres dirigeants",
  '94;Entreprise Sauvageot Gilles;Alfortville;12 rue Véron;94140;Gilles;Sauvageot;Gérant;123456789;Actif;"Appeler le matin; demander Gilles";',
  "6;Ramonage Azur;Nice;;;Jean;Martin;Liquidateur;;Actif;;",
  "13;Fermé SARL;Marseille;;;;;;987654321;Fermée ou radiée;;",
  "",
].join("\r\n");

const records = recordsOf(parseCsv(CSV));

describe("prospect import rows", () => {
  it("reads quoted fields, separators inside quotes and the byte order mark", () => {
    expect(records).toHaveLength(3);
    expect(records[0]?.["Infos pour l'appel"]).toBe("Appeler le matin; demander Gilles");
  });

  it("maps a registry row to a company with its leader as main contact", () => {
    const company = importedCompanyOf(records[0] ?? {});
    expect(company).toMatchObject({
      name: "Entreprise Sauvageot Gilles",
      department: "94",
      siren: "123456789",
      postalCode: "94140",
      sourceRef: "carnet:123456789",
      leader: { firstName: "Gilles", lastName: "Sauvageot", jobTitle: "Gérant" },
    });
    expect(company?.id).toBe(stableIdOf("carnet:123456789"));
  });

  it("pads the department, skips liquidators and closed companies", () => {
    const azur = importedCompanyOf(records[1] ?? {});
    expect(azur).toMatchObject({ department: "06", leader: null });
    expect(azur?.sourceRef).toBe("carnet:ramonage azur 06");
    expect(importedCompanyOf(records[2] ?? {})).toBeNull();
  });

  it("normalizes search text exactly like the API", () => {
    for (const text of ["Étienne & Fils", "L'Âtre d'Île-de-France", "SOS  Ramonage 94"]) {
      expect(normalizeSearchText(text)).toBe(sharedNormalize(text));
    }
  });
});
