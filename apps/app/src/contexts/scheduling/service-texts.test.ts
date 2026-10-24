import { TRADE_IDS } from "@passalio/trades";
import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatServicePrice,
  schedulingFr,
  SERVICE_DOCUMENT_LABELS,
  VISIT_TYPE_LABELS,
  visitServicesLabel,
  visitTypesLabel,
} from "./fr";

const form = schedulingFr.form;
const settings = schedulingFr.services;

const withPlainSpaces = (text: string) => text.replaceAll(/\s/g, " ");

describe("formatDuration", () => {
  it.each([
    [15, "15 min"],
    [45, "45 min"],
    [60, "1 h"],
    [75, "1 h 15"],
    [90, "1 h 30"],
    [120, "2 h"],
    [135, "2 h 15"],
    [480, "8 h"],
  ])("writes %i minutes as %j", (minutes, label) => {
    expect(formatDuration(minutes)).toBe(label);
  });

  it.each([
    [1440, "1 jour"],
    [2880, "2 jours"],
    [14400, "10 jours"],
  ])("writes %i minutes as %j", (minutes, label) => {
    expect(formatDuration(minutes)).toBe(label);
  });
});

describe("VISIT_TYPE_LABELS", () => {
  it("names every trade", () => {
    expect(Object.keys(VISIT_TYPE_LABELS).toSorted()).toEqual([...TRADE_IDS].toSorted());
    expect(VISIT_TYPE_LABELS.chimney_sweeping).toBe("Ramonage");
    expect(VISIT_TYPE_LABELS.stove_maintenance).toBe("Entretien de poêle");
    expect(VISIT_TYPE_LABELS.boiler_maintenance).toBe("Entretien de chaudière");
    expect(VISIT_TYPE_LABELS.heat_pump_maintenance).toBe("Entretien de pompe à chaleur");
    expect(VISIT_TYPE_LABELS.septic_tank_emptying).toBe("Vidange de fosse");
  });
});

describe("visitTypesLabel", () => {
  it("joins the labels of the visit types", () => {
    expect(visitTypesLabel(["chimney_sweeping"])).toBe("Ramonage");
    expect(visitTypesLabel(["chimney_sweeping", "stove_maintenance"])).toBe(
      "Ramonage, Entretien de poêle",
    );
  });

  it("is empty without type", () => {
    expect(visitTypesLabel([])).toBe("");
  });
});

describe("visitServicesLabel", () => {
  it("names the services of the visit", () => {
    expect(
      visitServicesLabel({
        serviceLines: [{ name: "Ramonage conduit" }, { name: "Débistrage" }],
        visitTypes: ["chimney_sweeping"],
      }),
    ).toBe("Ramonage conduit, Débistrage");
  });

  it("falls back on the visit types of a visit booked before services", () => {
    expect(
      visitServicesLabel({
        serviceLines: [],
        visitTypes: ["chimney_sweeping", "stove_maintenance"],
      }),
    ).toBe("Ramonage, Entretien de poêle");
  });

  it("is empty without service nor type", () => {
    expect(visitServicesLabel({ serviceLines: [], visitTypes: [] })).toBe("");
  });
});

describe("SERVICE_DOCUMENT_LABELS", () => {
  it("names each document handed over", () => {
    expect(SERVICE_DOCUMENT_LABELS).toEqual({
      chimney_sweeping_certificate: "Certificat de ramonage",
      maintenance_certificate: "Attestation d'entretien",
      none: "Aucun document",
    });
  });
});

describe("formatServicePrice", () => {
  it("writes a price in euros", () => {
    expect(withPlainSpaces(formatServicePrice(8000))).toBe("80 €");
    expect(withPlainSpaces(formatServicePrice(7550))).toBe("75,50 €");
  });

  it("writes on quotation without price", () => {
    expect(formatServicePrice(null)).toBe("Sur devis");
  });
});

describe("services on the visit screen", () => {
  it("shows the services with the duration", () => {
    expect(schedulingFr.visit.visitType).toBe("Prestations");
    expect(schedulingFr.visit.typeAndDuration("Ramonage", formatDuration(60))).toBe(
      "Ramonage · 1 h",
    );
  });

  it("labels one or several technicians", () => {
    expect(schedulingFr.visit.technician).toBe("Technicien");
    expect(schedulingFr.visit.technicians).toBe("Techniciens");
  });
});

describe("duration hint of the new visit form", () => {
  it("asks to choose the duration without service", () => {
    expect(form.durationHint([])).toBe("Choisissez la durée prévue.");
  });

  it("names the usual duration of a single service", () => {
    expect(form.durationHint([{ name: "Ramonage", durationMinutes: 60 }])).toBe(
      "Durée habituelle : 1 h. Vous pouvez la changer.",
    );
    expect(form.durationHint([{ name: "Tubage", durationMinutes: 2880 }])).toBe(
      "Durée habituelle : 2 jours. Vous pouvez la changer.",
    );
  });

  it("details the durations of several services", () => {
    expect(
      form.durationHint([
        { name: "Ramonage", durationMinutes: 60 },
        { name: "Entretien poêle", durationMinutes: 90 },
      ]),
    ).toBe("Ramonage 1 h + entretien poêle 1 h 30.");
  });

  it("tells the duration was changed for this visit and offers to restore it", () => {
    expect(form.durationChanged(60)).toBe("Modifiée pour ce passage. Habituellement 1 h.");
    expect(form.durationReset(60)).toBe("Remettre 1 h");
    expect(form.durationReset(150)).toBe("Remettre 2 h 30");
  });
});

describe("services field of the new visit form", () => {
  it("labels the required services field and its error", () => {
    expect(form.services).toBe("Prestations");
    expect(form.errors.services).toBe("Choisissez au moins une prestation.");
    expect(form.servicesPlaceholder).toBe("Choisir les prestations");
    expect(form.servicesCount(2)).toBe("2 prestations choisies");
  });

  it("shows the duration and the price on the confirm button", () => {
    expect(form.servicesConfirm("2 h 30", "80 €")).toBe("Valider · 2 h 30 · 80 €");
    expect(form.servicesConfirm("1 h", null)).toBe("Valider · 1 h");
  });

  it("details the prices of the chosen services", () => {
    expect(
      withPlainSpaces(
        form.priceFromServices([
          { name: "Ramonage", priceCents: 8000 },
          { name: "Entretien poêle", priceCents: null },
        ]),
      ),
    ).toBe("Ramonage 80 € + entretien poêle sur devis. Vous pouvez le changer.");
  });

  it("asks to choose at least one technician", () => {
    expect(form.technician).toBe("Techniciens");
    expect(form.errors.technician).toBe("Choisissez au moins un technicien.");
    expect(form.removeTechnician("Zoé Roux")).toBe("Retirer Zoé Roux");
  });
});

describe("services settings texts", () => {
  it("summarises a service on one line", () => {
    expect(settings.summary("1 h", "Sur devis", "Aucun document")).toBe(
      "1 h · Sur devis · Aucun document",
    );
  });

  it("offers to add the services of the company's trades when the list is empty", () => {
    expect(settings.emptyTitle).toBe("Aucune prestation");
    expect(settings.addDefaults).toBe("Ajouter les prestations de vos métiers");
  });

  it("confirms, reports a failed save, a failed archive and a failed load", () => {
    expect(settings.created).toBe("Prestation ajoutée.");
    expect(settings.saved).toBe("Prestation enregistrée. Elle s'applique aux prochains passages.");
    expect(settings.archived).toBe("Prestation retirée. Les passages déjà prévus la gardent.");
    expect(settings.saveFailed).toBe("La prestation n'a pas pu être enregistrée. Réessayez.");
    expect(settings.archiveFailed).toBe("La prestation n'a pas pu être retirée. Réessayez.");
    expect(settings.loadFailed).toBe(
      "Impossible de récupérer les prestations. Vérifiez votre connexion puis réessayez.",
    );
    expect(settings.loading).toBe("Chargement des prestations");
  });

  it("tells the secretary and the technicians the list is read-only", () => {
    expect(settings.readOnly).toBe(
      "Seuls le gérant et les administrateurs modifient les prestations.",
    );
  });
});
