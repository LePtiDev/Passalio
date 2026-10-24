import { Brush, Cylinder, Flame, Heater, Tag, Thermometer, Wrench } from "lucide-react";
import { describe, expect, it } from "vitest";
import type { ServiceRecord } from "@/lib/db/local-records";
import { serviceIconOf } from "./components/services/service-icon";
import { schedulingFr } from "./fr";
import { matchingServices } from "./services";

const serviceOf = (id: string, name: string): ServiceRecord => ({
  id,
  name,
  durationMinutes: 60,
  priceCents: 8000,
  document: "none",
  trade: null,
});

const offered = [
  serviceOf("sweeping", "Ramonage de conduit"),
  serviceOf("unblocking", "Débistrage"),
  serviceOf("stove", "Entretien de poêle à granulés"),
];

describe("searching the services of a visit", () => {
  it("shows every service when the search is empty or blank", () => {
    expect(matchingServices(offered, "")).toEqual(offered);
    expect(matchingServices(offered, "   ")).toEqual(offered);
  });

  it("finds a service by part of its name, ignoring case and accents", () => {
    expect(matchingServices(offered, "DEBIS").map(({ id }) => id)).toEqual(["unblocking"]);
    expect(matchingServices(offered, "poele").map(({ id }) => id)).toEqual(["stove"]);
    expect(matchingServices(offered, "conduit").map(({ id }) => id)).toEqual(["sweeping"]);
  });

  it("finds nothing when no name matches", () => {
    expect(matchingServices(offered, "fosse")).toEqual([]);
  });
});

describe("icon of a service", () => {
  it("follows the kind of work named by the service before its trade", () => {
    expect(serviceIconOf("Débistrage", "chimney_sweeping")).toBe(Brush);
    expect(serviceIconOf("Pose de tubage", null)).toBe(Cylinder);
    expect(serviceIconOf("Installation de chaudière", "boiler_maintenance")).toBe(Wrench);
  });

  it("falls back on the trade, then on a tag for a service without trade", () => {
    expect(serviceIconOf("Ramonage de conduit", "chimney_sweeping")).toBe(Flame);
    expect(serviceIconOf("Entretien de poêle à granulés", "stove_maintenance")).toBe(Heater);
    expect(serviceIconOf("Entretien de chaudière", "boiler_maintenance")).toBe(Thermometer);
    expect(serviceIconOf("Déplacement", null)).toBe(Tag);
  });

  it("recognises boiler and stove work on a service without trade", () => {
    expect(serviceIconOf("Entretien de chaudière", null)).toBe(Thermometer);
    expect(serviceIconOf("Nettoyage de poêle", null)).toBe(Heater);
  });
});

describe("texts of the services menu and list", () => {
  const form = schedulingFr.form;

  it("sums up the chosen services under the desktop menu", () => {
    expect(form.servicesTotal(2, "3 h", "255 €")).toBe("2 prestations · 3 h · 255 €");
    expect(form.servicesTotal(1, "2 jours", null)).toBe("1 prestation · 2 jours");
    expect(form.servicesSearch).toBe("Rechercher une prestation");
    expect(form.servicesNoMatch).toBe("Aucune prestation ne correspond.");
    expect(form.manageServices).toBe("Gérer les prestations");
  });

  it("leaves out the document on a mobile row when none is handed over", () => {
    expect(schedulingFr.services.shortSummary("4 h", "900 €")).toBe("4 h · 900 €");
  });
});
