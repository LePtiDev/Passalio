import { interventionFields } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import { schedulingFr } from "./fr";
import { toInterventionFields, visitFormSchema, type VisitFormValues } from "./visit-form-schema";

const errors = schedulingFr.form.errors;

const validForm: VisitFormValues = {
  customerId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a01",
  siteId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a02",
  scheduledDate: "2026-10-23",
  startTime: "09:30",
  technicianUserId: "user-1",
  visitTypes: ["chimney_sweeping"],
  durationMinutes: 60,
  equipmentIds: [],
  price: "",
  notes: "",
};

const issuesOf = (values: Record<string, unknown>) => {
  const result = visitFormSchema.safeParse({ ...validForm, ...values });
  return (result.error?.issues ?? []).map(({ path, message }) => ({
    path: path.join("."),
    message,
  }));
};

describe("visitFormSchema visit types", () => {
  it("accepts one or several visit types", () => {
    expect(issuesOf({})).toEqual([]);
    expect(issuesOf({ visitTypes: ["chimney_sweeping", "stove_maintenance"] })).toEqual([]);
  });

  it("asks to choose a visit type when the company has types and none is chosen", () => {
    expect(issuesOf({ visitTypes: [] })).toEqual([
      { path: "visitTypes", message: errors.visitType },
    ]);
  });

  it("accepts a visit without visit types when they are not known on the device", () => {
    expect(issuesOf({ visitTypes: undefined })).toEqual([]);
  });

  it("refuses an unknown visit type", () => {
    expect(issuesOf({ visitTypes: ["window_cleaning"] }).map(({ path }) => path)).toEqual([
      "visitTypes.0",
    ]);
  });
});

describe("visitFormSchema duration", () => {
  it.each([15, 45, 60, 90, 150, 480])("accepts %i minutes", (durationMinutes) => {
    expect(issuesOf({ durationMinutes })).toEqual([]);
  });

  it.each([0, 10, 50, 495, 540])("refuses %i minutes", (durationMinutes) => {
    expect([...new Set(issuesOf({ durationMinutes }).map(({ path }) => path))]).toEqual([
      "durationMinutes",
    ]);
  });
});

describe("toInterventionFields with visit types", () => {
  it("keeps the chosen visit types and duration", () => {
    expect(
      toInterventionFields({
        ...validForm,
        visitTypes: ["chimney_sweeping", "stove_maintenance"],
        durationMinutes: 150,
      }),
    ).toMatchObject({
      visitTypes: ["chimney_sweeping", "stove_maintenance"],
      durationMinutes: 150,
    });
  });

  it("saves a visit of 1 hour without type when types are not known", () => {
    expect(
      toInterventionFields({ ...validForm, visitTypes: undefined, durationMinutes: undefined }),
    ).toMatchObject({ visitTypes: [], durationMinutes: 60 });
  });

  it("produces fields the server accepts", () => {
    const parsed = visitFormSchema.parse({
      ...validForm,
      visitTypes: ["chimney_sweeping", "boiler_maintenance"],
      durationMinutes: 120,
    });
    expect(interventionFields.safeParse(toInterventionFields(parsed)).success).toBe(true);
  });
});
