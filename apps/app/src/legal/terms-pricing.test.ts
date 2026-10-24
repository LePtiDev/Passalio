import { describe, expect, it } from "vitest";
import { identityFr } from "@/contexts/identity/fr";
import { fr } from "@/fr";
import { TERMS_FR } from "./terms-fr";

const priceSectionText = () => {
  const section = TERMS_FR.sections.find((candidate) => candidate.id === "prix");
  if (section === undefined) {
    throw new Error("no price section");
  }
  return section.blocks.flatMap((block) => (block.kind === "list" ? block.items : [])).join("\n");
};

describe("subscription prices (ADR 0025)", () => {
  it("lists the Solo plan for one technician at 29 € a month or 290 € a year", () => {
    expect(priceSectionText()).toContain(
      "Formule Solo, pour un technicien : 29 € par mois ou 290 € par an.",
    );
  });

  it("lists the Team plan for unlimited technicians at 49 € a month or 490 € a year", () => {
    expect(priceSectionText()).toContain(
      "Formule Équipe, techniciens illimités : 49 € par mois ou 490 € par an.",
    );
  });

  it("keeps office users unlimited in both plans", () => {
    expect(priceSectionText()).toContain(
      "Les autres utilisateurs de l'espace du Client sont illimités dans les deux formules.",
    );
  });

  it("prorates the switch from Solo to Team", () => {
    expect(priceSectionText()).toContain("Le prix est ajusté au prorata de la période en cours.");
  });

  it("no longer shows the former single price", () => {
    expect(priceSectionText()).not.toContain("29,99");
    expect(identityFr.authLayout.pricing).not.toContain("29,99");
    expect(fr.home.trialText).not.toContain("29,99");
  });

  it("shows the starting price before tax on sign up and on the trial card", () => {
    expect(identityFr.authLayout.pricing).toBe("Dès 29 € HT par mois, sans engagement.");
    expect(fr.home.trialText).toBe("Puis dès 29 € HT par mois, sans engagement.");
  });
});
