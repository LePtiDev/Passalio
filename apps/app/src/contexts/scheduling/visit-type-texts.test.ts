import { TRADE_IDS } from "@passalio/trades";
import { describe, expect, it } from "vitest";
import { formatDuration, schedulingFr, VISIT_TYPE_LABELS, visitTypesLabel } from "./fr";

const form = schedulingFr.form;
const settings = schedulingFr.visitTypes;

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
});

describe("VISIT_TYPE_LABELS", () => {
  it("names every trade", () => {
    expect(Object.keys(VISIT_TYPE_LABELS).toSorted()).toEqual([...TRADE_IDS].toSorted());
    expect(VISIT_TYPE_LABELS.chimney_sweeping.label).toBe("Ramonage");
    expect(VISIT_TYPE_LABELS.stove_maintenance.label).toBe("Entretien de poêle");
    expect(VISIT_TYPE_LABELS.boiler_maintenance.label).toBe("Entretien de chaudière");
    expect(VISIT_TYPE_LABELS.heat_pump_maintenance.label).toBe("Entretien de pompe à chaleur");
    expect(VISIT_TYPE_LABELS.septic_tank_emptying.label).toBe("Vidange de fosse");
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

describe("visit type and duration on the visit screen", () => {
  it("shows the type with its duration", () => {
    expect(schedulingFr.visit.visitType).toBe("Type de passage");
    expect(schedulingFr.visit.typeAndDuration("Ramonage", formatDuration(60))).toBe(
      "Ramonage · 1 h",
    );
  });
});

describe("duration hint of the new visit form", () => {
  it("names the usual duration of a single type", () => {
    expect(form.durationHint([{ type: "chimney_sweeping", minutes: 60 }])).toBe(
      "Durée habituelle d'un ramonage. Vous pouvez la changer.",
    );
    expect(form.durationHint([{ type: "septic_tank_emptying", minutes: 120 }])).toBe(
      "Durée habituelle d'une vidange de fosse. Vous pouvez la changer.",
    );
  });

  it("details the durations of several types", () => {
    expect(
      form.durationHint([
        { type: "chimney_sweeping", minutes: 60 },
        { type: "stove_maintenance", minutes: 90 },
      ]),
    ).toBe("Ramonage 1 h + entretien de poêle 1 h 30.");
  });

  it("tells the duration was changed for this visit and offers to restore it", () => {
    expect(form.durationChanged(60)).toBe("Modifiée pour ce passage. Habituellement 1 h.");
    expect(form.durationReset(60)).toBe("Remettre 1 h");
    expect(form.durationReset(150)).toBe("Remettre 2 h 30");
  });

  it("labels the required visit type field and its error", () => {
    expect(form.visitType).toBe("Type de passage");
    expect(form.errors.visitType).toBe("Choisissez le type de passage.");
  });
});

describe("visit types settings texts", () => {
  it("shows the default duration of a type", () => {
    expect(settings.defaultDuration(formatDuration(60))).toBe("Durée par défaut : 1 h");
  });

  it("confirms, reports a failed save and a failed load", () => {
    expect(settings.saved).toBe("Durée enregistrée. Elle s'applique aux prochains passages.");
    expect(settings.saveFailed).toBe("La durée n'a pas pu être enregistrée. Réessayez.");
    expect(settings.loadFailed).toBe(
      "Impossible de récupérer les types de passage. Vérifiez votre connexion puis réessayez.",
    );
    expect(settings.loading).toBe("Chargement des types de passage");
  });
});
