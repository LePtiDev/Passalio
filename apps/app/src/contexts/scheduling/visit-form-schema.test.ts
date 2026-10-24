import { interventionFields } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import { schedulingFr } from "./fr";
import {
  DEFAULT_DURATION_MINUTES,
  emptyVisitForm,
  priceCentsOf,
  toInterventionFields,
  visitFormSchema,
  type VisitFormValues,
} from "./visit-form-schema";

const errors = schedulingFr.form.errors;

const validForm: VisitFormValues = {
  customerId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a01",
  siteId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a02",
  scheduledDate: "2026-10-23",
  startTime: "09:30",
  technicianUserId: "user-1",
  equipmentIds: ["6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a03"],
  price: "",
  notes: "",
};

const issuesOf = (values: Partial<VisitFormValues>) => {
  const result = visitFormSchema.safeParse({ ...validForm, ...values });
  return (result.error?.issues ?? []).map(({ path, message }) => ({
    path: path.join("."),
    message,
  }));
};

describe("visitFormSchema", () => {
  it("accepts a complete visit without price nor notes", () => {
    expect(issuesOf({})).toEqual([]);
  });

  it("requires a customer", () => {
    expect(issuesOf({ customerId: "" })).toEqual([
      { path: "customerId", message: errors.customer },
    ]);
  });

  it("requires a site", () => {
    expect(issuesOf({ siteId: "" })).toEqual([{ path: "siteId", message: errors.site }]);
  });

  it("requires a date", () => {
    expect(issuesOf({ scheduledDate: "" })).toEqual([
      { path: "scheduledDate", message: errors.date },
    ]);
  });

  it("requires a start time", () => {
    expect(issuesOf({ startTime: "" })).toEqual([{ path: "startTime", message: errors.time }]);
  });

  it("refuses a time that does not exist", () => {
    expect(issuesOf({ startTime: "25:00" })).toEqual([{ path: "startTime", message: errors.time }]);
  });

  it("requires a technician", () => {
    expect(issuesOf({ technicianUserId: "" })).toEqual([
      { path: "technicianUserId", message: errors.technician },
    ]);
  });

  it("accepts a visit without equipment", () => {
    expect(issuesOf({ equipmentIds: [] })).toEqual([]);
  });

  it.each(["75", "75,50", "75.5", "75 €", "75,50 €", " 1 250 € ", "0"])(
    "accepts the price %j",
    (price) => {
      expect(issuesOf({ price })).toEqual([]);
    },
  );

  it.each(["abc", "-5", "75,555", "75,", "100001", "12 euros"])("refuses the price %j", (price) => {
    expect(issuesOf({ price })).toEqual([{ path: "price", message: errors.price }]);
  });

  it("refuses notes longer than 2000 characters", () => {
    expect(issuesOf({ notes: "a".repeat(2001) }).map(({ path }) => path)).toEqual(["notes"]);
  });
});

describe("priceCentsOf", () => {
  it.each([
    ["75", 7500],
    ["75,50", 7550],
    ["75,5", 7550],
    ["75.05", 7505],
    ["75 €", 7500],
    ["75,50 €", 7550],
    ["1 250", 125000],
    ["0,1", 10],
    ["19,99", 1999],
  ])("converts %j to %i cents", (price, cents) => {
    expect(priceCentsOf(price)).toBe(cents);
  });

  it("returns no price when the field is empty", () => {
    expect(priceCentsOf("")).toBeNull();
    expect(priceCentsOf("  ")).toBeNull();
    expect(priceCentsOf("€")).toBeNull();
  });
});

describe("emptyVisitForm", () => {
  it("starts from the given customer, day and technician", () => {
    expect(
      emptyVisitForm({ customerId: "c", scheduledDate: "2026-10-23", technicianUserId: "u" }),
    ).toEqual({
      customerId: "c",
      scheduledDate: "2026-10-23",
      technicianUserId: "u",
      siteId: "",
      startTime: "",
      equipmentIds: [],
      price: "",
      notes: "",
    });
  });
});

describe("toInterventionFields", () => {
  it("lasts 60 minutes by default", () => {
    expect(DEFAULT_DURATION_MINUTES).toBe(60);
    expect(toInterventionFields(validForm).durationMinutes).toBe(60);
  });

  it("converts the price to cents and empty notes to null", () => {
    const fields = toInterventionFields({ ...validForm, price: "75,50 €", notes: "" });
    expect(fields.announcedPriceCents).toBe(7550);
    expect(fields.notes).toBeNull();
  });

  it("leaves the price empty when none is given", () => {
    expect(toInterventionFields(validForm).announcedPriceCents).toBeNull();
  });

  it("keeps the notes, the time and the equipments", () => {
    const fields = toInterventionFields({ ...validForm, notes: "Code portail 1234" });
    expect(fields).toMatchObject({
      customerId: validForm.customerId,
      siteId: validForm.siteId,
      technicianUserId: "user-1",
      scheduledDate: "2026-10-23",
      startTime: "09:30",
      equipmentIds: validForm.equipmentIds,
      notes: "Code portail 1234",
    });
  });

  it("produces fields the server accepts", () => {
    const parsed = visitFormSchema.parse({ ...validForm, price: " 75,50 € ", notes: "  Chien  " });
    expect(interventionFields.safeParse(toInterventionFields(parsed)).success).toBe(true);
  });
});
