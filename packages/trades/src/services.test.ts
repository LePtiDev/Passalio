import { describe, expect, it } from "vitest";
import {
  DAY_MINUTES,
  daysOf,
  DEFAULT_SERVICE_DOCUMENTS,
  defaultServiceOf,
  isDayDuration,
  MAX_SERVICE_DAYS,
  MAX_SERVICE_PRICE_CENTS,
  SERVICE_NAME_MAX_LENGTH,
  serviceChanges,
  serviceDurationMinutes,
  serviceFields,
  servicePriceCents,
  visitMinutesOfService,
} from "./services";
import { TRADE_IDS } from "./trade-ids";

const validService = {
  name: "Ramonage conduit bois",
  durationMinutes: 60,
  priceCents: 8000,
  document: "chimney_sweeping_certificate",
  trade: "chimney_sweeping",
};

describe("serviceDurationMinutes", () => {
  it.each([15, 30, 45, 60, 465, 480])("accepts %i minutes on the 15-minute step", (minutes) => {
    expect(serviceDurationMinutes.safeParse(minutes).success).toBe(true);
  });

  it.each([0, 10, 50, 495, 600, 1500])("refuses %i minutes", (minutes) => {
    expect(serviceDurationMinutes.safeParse(minutes).success).toBe(false);
  });

  it.each([1, 2, 5, 10])("accepts %i whole days", (days) => {
    expect(serviceDurationMinutes.safeParse(days * DAY_MINUTES).success).toBe(true);
  });

  it("refuses more than ten days", () => {
    expect(serviceDurationMinutes.safeParse((MAX_SERVICE_DAYS + 1) * DAY_MINUTES).success).toBe(
      false,
    );
  });

  it("refuses a duration that is not a whole number", () => {
    expect(serviceDurationMinutes.safeParse(15.5).success).toBe(false);
  });
});

describe("servicePriceCents", () => {
  it("accepts a price on quotation", () => {
    expect(servicePriceCents.safeParse(null).success).toBe(true);
  });

  it("accepts a free service and the maximum price", () => {
    expect(servicePriceCents.safeParse(0).success).toBe(true);
    expect(servicePriceCents.safeParse(MAX_SERVICE_PRICE_CENTS).success).toBe(true);
  });

  it("refuses a negative, fractional or too high price", () => {
    expect(servicePriceCents.safeParse(-1).success).toBe(false);
    expect(servicePriceCents.safeParse(10.5).success).toBe(false);
    expect(servicePriceCents.safeParse(MAX_SERVICE_PRICE_CENTS + 1).success).toBe(false);
  });
});

describe("serviceFields", () => {
  it("accepts a complete service and trims its name", () => {
    expect(serviceFields.parse({ ...validService, name: "  Ramonage  " })).toEqual({
      ...validService,
      name: "Ramonage",
    });
  });

  it("accepts a service without trade nor price", () => {
    expect(
      serviceFields.safeParse({ ...validService, trade: null, priceCents: null, document: "none" })
        .success,
    ).toBe(true);
  });

  it("refuses an empty or blank name", () => {
    expect(serviceFields.safeParse({ ...validService, name: "" }).success).toBe(false);
    expect(serviceFields.safeParse({ ...validService, name: "   " }).success).toBe(false);
  });

  it("refuses a name longer than the limit", () => {
    expect(
      serviceFields.safeParse({ ...validService, name: "a".repeat(SERVICE_NAME_MAX_LENGTH + 1) })
        .success,
    ).toBe(false);
    expect(
      serviceFields.safeParse({ ...validService, name: "a".repeat(SERVICE_NAME_MAX_LENGTH) })
        .success,
    ).toBe(true);
  });

  it("refuses an unknown document or trade", () => {
    expect(serviceFields.safeParse({ ...validService, document: "invoice" }).success).toBe(false);
    expect(serviceFields.safeParse({ ...validService, trade: "plumbing" }).success).toBe(false);
  });

  it("requires every field", () => {
    const { trade: _trade, ...withoutTrade } = validService;
    expect(serviceFields.safeParse(withoutTrade).success).toBe(false);
  });
});

describe("serviceChanges", () => {
  it("accepts a partial change", () => {
    expect(serviceChanges.parse({ priceCents: 9000 })).toEqual({ priceCents: 9000 });
  });

  it("accepts no change at all", () => {
    expect(serviceChanges.safeParse({}).success).toBe(true);
  });

  it("refuses an unknown key", () => {
    expect(serviceChanges.safeParse({ priceCents: 9000, color: "red" }).success).toBe(false);
  });

  it("refuses an invalid duration", () => {
    expect(serviceChanges.safeParse({ durationMinutes: 50 }).success).toBe(false);
  });
});

describe("isDayDuration and daysOf", () => {
  it("treats durations under one day as hours", () => {
    expect(isDayDuration(480)).toBe(false);
    expect(isDayDuration(DAY_MINUTES - 1)).toBe(false);
  });

  it("treats durations of one day or more as days", () => {
    expect(isDayDuration(DAY_MINUTES)).toBe(true);
    expect(isDayDuration(3 * DAY_MINUTES)).toBe(true);
  });

  it("counts the days of a day duration", () => {
    expect(daysOf(DAY_MINUTES)).toBe(1);
    expect(daysOf(10 * DAY_MINUTES)).toBe(10);
  });
});

describe("defaultServiceOf", () => {
  it("builds a service on quotation with the usual duration and document of the trade", () => {
    expect(defaultServiceOf("chimney_sweeping", "Ramonage")).toEqual({
      name: "Ramonage",
      durationMinutes: 60,
      priceCents: null,
      document: "chimney_sweeping_certificate",
      trade: "chimney_sweeping",
    });
  });

  it.each(TRADE_IDS)("builds a valid service for %s", (trade) => {
    const service = defaultServiceOf(trade, "Prestation");
    expect(serviceFields.safeParse(service).success).toBe(true);
    expect(service.document).toBe(DEFAULT_SERVICE_DOCUMENTS[trade]);
  });

  it("hands over no document for septic tank emptying", () => {
    expect(defaultServiceOf("septic_tank_emptying", "Vidange").document).toBe("none");
  });

  it("hands over a maintenance certificate for boiler maintenance", () => {
    expect(defaultServiceOf("boiler_maintenance", "Entretien").document).toBe(
      "maintenance_certificate",
    );
  });
});

describe("visitMinutesOfService", () => {
  it("keeps a duration of eight hours or less", () => {
    expect(visitMinutesOfService(90)).toBe(90);
    expect(visitMinutesOfService(480)).toBe(480);
  });

  it("caps a day duration at eight hours on the planning", () => {
    expect(visitMinutesOfService(DAY_MINUTES)).toBe(480);
    expect(visitMinutesOfService(3 * DAY_MINUTES)).toBe(480);
  });
});
