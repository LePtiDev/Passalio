import { ForbiddenError, type Actor, type OrganizationRole } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import type { Intervention } from "./intervention-models";
import {
  assertCanManageInterventionOf,
  canManageInterventionOf,
  cancellationChanges,
  checkEquipmentsAtPlace,
  completionChanges,
  newIntervention,
  plannedChanges,
} from "./intervention-rules";

const actorOf = (role: OrganizationRole, isImpersonating = false): Actor => ({
  userId: `user-${role}`,
  organizationId: "organization-a",
  role,
  isImpersonating,
});

const CREATED_AT = new Date("2026-10-23T08:00:00Z");
const LATER = new Date("2026-10-23T12:00:00Z");

const fields = {
  customerId: "customer-1",
  siteId: "site-1",
  technicianUserId: "user-technician",
  scheduledDate: "2026-10-28",
  durationMinutes: 60,
  equipmentIds: ["equipment-1"],
};

const planned = (): Intervention =>
  newIntervention(fields, {
    id: "intervention-1",
    organizationId: "organization-a",
    createdByUserId: "user-secretary",
    equipmentIds: ["equipment-1"],
    at: CREATED_AT,
  });

const withStatus = (status: Intervention["status"]): Intervention => ({ ...planned(), status });

describe("canManageInterventionOf", () => {
  it.each<OrganizationRole>(["owner", "admin", "secretary"])(
    "lets a %s manage the interventions of any technician",
    (role) => {
      expect(canManageInterventionOf(actorOf(role), "user-technician")).toBe(true);
      expect(canManageInterventionOf(actorOf(role), "user-other")).toBe(true);
    },
  );

  it("lets a technician manage only his own interventions", () => {
    expect(canManageInterventionOf(actorOf("technician"), "user-technician")).toBe(true);
    expect(canManageInterventionOf(actorOf("technician"), "user-other")).toBe(false);
  });

  it.each<OrganizationRole>(["owner", "admin", "secretary", "technician"])(
    "refuses every intervention write to an impersonated %s",
    (role) => {
      expect(canManageInterventionOf(actorOf(role, true), `user-${role}`)).toBe(false);
    },
  );

  it("throws a forbidden error when the actor cannot manage the intervention", () => {
    expect(() => assertCanManageInterventionOf(actorOf("technician"), "user-other")).toThrow(
      ForbiddenError,
    );
    expect(() =>
      assertCanManageInterventionOf(actorOf("technician"), "user-technician"),
    ).not.toThrow();
  });
});

describe("checkEquipmentsAtPlace", () => {
  const place = { customerId: "customer-1", equipmentIds: ["equipment-1", "equipment-2"] };

  it("collapses duplicate equipment ids into one", () => {
    expect(checkEquipmentsAtPlace(["equipment-1", "equipment-2", "equipment-1"], place)).toEqual({
      isOk: true,
      value: ["equipment-1", "equipment-2"],
    });
  });

  it("refuses an equipment that is not at the site", () => {
    expect(checkEquipmentsAtPlace(["equipment-1", "equipment-9"], place)).toEqual({
      isOk: false,
      error: "equipment_not_found",
    });
  });

  it("accepts an intervention without equipment", () => {
    expect(checkEquipmentsAtPlace([], place)).toEqual({ isOk: true, value: [] });
  });
});

describe("newIntervention", () => {
  it("starts planned, unpaid and with empty optional fields", () => {
    expect(planned()).toMatchObject({
      status: "planned",
      completedOn: null,
      paymentMethod: null,
      paidAmountCents: null,
      startTime: null,
      announcedPriceCents: null,
      notes: null,
      createdByUserId: "user-secretary",
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    });
  });
});

describe("plannedChanges", () => {
  it("accepts changes on a planned intervention and stamps the update time", () => {
    expect(plannedChanges(planned(), { durationMinutes: 90 }, LATER)).toEqual({
      isOk: true,
      value: { durationMinutes: 90, updatedAt: LATER },
    });
  });

  it.each<Intervention["status"]>(["completed", "cancelled"])(
    "refuses changes on a %s intervention",
    (status) => {
      expect(plannedChanges(withStatus(status), { durationMinutes: 90 }, LATER)).toEqual({
        isOk: false,
        error: "intervention_closed",
      });
    },
  );
});

describe("completionChanges", () => {
  it("records the completion day, payment method and paid amount", () => {
    expect(
      completionChanges(
        planned(),
        { completedOn: "2026-10-28", paymentMethod: "check", paidAmountCents: 8000 },
        LATER,
      ),
    ).toEqual({
      isOk: true,
      value: {
        status: "completed",
        completedOn: "2026-10-28",
        paymentMethod: "check",
        paidAmountCents: 8000,
        updatedAt: LATER,
      },
    });
  });

  it("leaves the payment empty when it is not given", () => {
    const changes = completionChanges(planned(), { completedOn: "2026-10-28" }, LATER);
    expect(changes).toMatchObject({
      isOk: true,
      value: { paymentMethod: null, paidAmountCents: null },
    });
  });

  it("refuses to complete a cancelled intervention", () => {
    expect(
      completionChanges(withStatus("cancelled"), { completedOn: "2026-10-28" }, LATER),
    ).toEqual({ isOk: false, error: "intervention_closed" });
  });
});

describe("cancellationChanges", () => {
  it("cancels a planned intervention", () => {
    expect(cancellationChanges(planned(), LATER)).toEqual({
      isOk: true,
      value: { status: "cancelled", updatedAt: LATER },
    });
  });

  it("has nothing to change on an intervention already cancelled", () => {
    expect(cancellationChanges(withStatus("cancelled"), LATER)).toEqual({
      isOk: true,
      value: undefined,
    });
  });

  it("refuses to cancel a completed intervention", () => {
    expect(cancellationChanges(withStatus("completed"), LATER)).toEqual({
      isOk: false,
      error: "intervention_closed",
    });
  });
});
