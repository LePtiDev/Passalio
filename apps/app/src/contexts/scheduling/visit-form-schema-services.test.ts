import { interventionFields, type ServiceLine } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import { schedulingFr } from "./fr";
import { toInterventionFields, visitFormSchema, type VisitFormValues } from "./visit-form-schema";

const errors = schedulingFr.form.errors;

const sweeping: ServiceLine = {
  serviceId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6b01",
  name: "Ramonage",
  durationMinutes: 60,
  priceCents: 8000,
};

const relining: ServiceLine = {
  serviceId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6b02",
  name: "Tubage",
  durationMinutes: 2880,
  priceCents: null,
};

const validForm: VisitFormValues = {
  customerId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a01",
  siteId: "6f1b1a3e-1a7a-4c55-9a4f-3c1f1f0d6a02",
  scheduledDate: "2026-10-23",
  startTime: "09:30",
  technicianUserId: "user-1",
  technicianUserIds: ["user-1"],
  serviceLines: [sweeping],
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

describe("visitFormSchema services", () => {
  it("accepts one or several services", () => {
    expect(issuesOf({})).toEqual([]);
    expect(issuesOf({ serviceLines: [sweeping, relining] })).toEqual([]);
  });

  it("asks to choose a service when the company has services and none is chosen", () => {
    expect(issuesOf({ serviceLines: [] })).toEqual([
      { path: "serviceLines", message: errors.services },
    ]);
  });

  it("accepts a visit without services when they are not known on the device", () => {
    expect(issuesOf({ serviceLines: undefined, visitTypes: undefined })).toEqual([]);
  });

  it("refuses a service line without identifier", () => {
    expect(
      issuesOf({ serviceLines: [{ ...sweeping, serviceId: "" }] }).map(({ path }) => path),
    ).toEqual(["serviceLines.0.serviceId"]);
  });
});

describe("visitFormSchema technicians", () => {
  it("accepts two technicians", () => {
    expect(issuesOf({ technicianUserIds: ["user-1", "user-2"] })).toEqual([]);
  });

  it("asks to choose a technician", () => {
    expect(issuesOf({ technicianUserId: "" })).toEqual([
      { path: "technicianUserId", message: errors.technician },
    ]);
  });
});

describe("visitFormSchema duration", () => {
  it.each([15, 45, 60, 90, 150, 480])("accepts %i minutes", (durationMinutes) => {
    expect(issuesOf({ durationMinutes })).toEqual([]);
  });

  it.each([0, 10, 50, 495, 540, 1440])("refuses %i minutes", (durationMinutes) => {
    expect([...new Set(issuesOf({ durationMinutes }).map(({ path }) => path))]).toEqual([
      "durationMinutes",
    ]);
  });
});

describe("toInterventionFields with services and technicians", () => {
  it("keeps the chosen service lines, visit types and duration", () => {
    expect(
      toInterventionFields({
        ...validForm,
        serviceLines: [sweeping, relining],
        durationMinutes: 480,
      }),
    ).toMatchObject({
      serviceLines: [sweeping, relining],
      visitTypes: ["chimney_sweeping"],
      durationMinutes: 480,
    });
  });

  it("keeps the technicians with the lead first", () => {
    expect(
      toInterventionFields({
        ...validForm,
        technicianUserId: "user-2",
        technicianUserIds: ["user-2", "user-1"],
      }),
    ).toMatchObject({ technicianUserId: "user-2", technicianUserIds: ["user-2", "user-1"] });
  });

  it("sends the lead alone when no technician list is given", () => {
    expect(
      toInterventionFields({ ...validForm, technicianUserIds: undefined }).technicianUserIds,
    ).toEqual(["user-1"]);
  });

  it("saves a visit of 1 hour without service when services are not known", () => {
    expect(
      toInterventionFields({
        ...validForm,
        serviceLines: undefined,
        visitTypes: undefined,
        durationMinutes: undefined,
      }),
    ).toMatchObject({ serviceLines: [], visitTypes: [], durationMinutes: 60 });
  });

  it("produces fields the server accepts", () => {
    const parsed = visitFormSchema.parse({
      ...validForm,
      technicianUserIds: ["user-1", "user-2"],
      serviceLines: [sweeping, relining],
      durationMinutes: 480,
      price: "80",
    });
    expect(interventionFields.safeParse(toInterventionFields(parsed)).success).toBe(true);
  });
});
