import {
  ForbiddenError,
  type Actor,
  type InterventionFields,
  type OrganizationRole,
  type ServiceLine,
} from "@passalio/shared";
import { describe, expect, it } from "vitest";
import {
  assertCanManageInterventionOf,
  canManageInterventionOf,
  changedTeam,
  checkServiceLines,
  newIntervention,
  plannedChanges,
  teamOf,
} from "./intervention-rules";

const actorOf = (
  role: OrganizationRole,
  userId = `user-${role}`,
  isImpersonating = false,
): Actor => ({
  userId,
  organizationId: "organization-a",
  role,
  isImpersonating,
});

const LEAD = "user-lead";
const SECOND = "user-second";
const THIRD = "user-third";

const SWEEPING_ID = "0190f3a0-0000-7000-8000-000000000501";
const STOVE_ID = "0190f3a0-0000-7000-8000-000000000502";

const sweeping: ServiceLine = {
  serviceId: SWEEPING_ID,
  name: "Ramonage",
  durationMinutes: 60,
  priceCents: 8000,
};

const stove: ServiceLine = {
  serviceId: STOVE_ID,
  name: "Entretien poêle",
  durationMinutes: 90,
  priceCents: null,
};

const fields = (overrides: Partial<InterventionFields> = {}): InterventionFields => ({
  customerId: "customer-1",
  siteId: "site-1",
  technicianUserId: LEAD,
  scheduledDate: "2026-10-28",
  durationMinutes: 60,
  equipmentIds: [],
  ...overrides,
});

const AT = new Date("2026-10-23T08:00:00Z");

describe("canManageInterventionOf with a list of technicians", () => {
  it("lets a technician manage a visit where he is the second technician", () => {
    expect(canManageInterventionOf(actorOf("technician", SECOND), [LEAD, SECOND])).toBe(true);
  });

  it("lets a technician manage a visit he leads", () => {
    expect(canManageInterventionOf(actorOf("technician", LEAD), [LEAD, SECOND])).toBe(true);
  });

  it("forbids a technician who is not in the list", () => {
    expect(canManageInterventionOf(actorOf("technician", THIRD), [LEAD, SECOND])).toBe(false);
  });

  it("forbids a technician on an empty list", () => {
    expect(canManageInterventionOf(actorOf("technician", LEAD), [])).toBe(false);
  });

  it.each<OrganizationRole>(["owner", "admin", "secretary"])(
    "lets the %s manage any list of technicians",
    (role) => {
      expect(canManageInterventionOf(actorOf(role), [LEAD, SECOND])).toBe(true);
    },
  );

  it("forbids an impersonated technician even when he is in the list", () => {
    expect(canManageInterventionOf(actorOf("technician", SECOND, true), [LEAD, SECOND])).toBe(
      false,
    );
  });

  it("throws a forbidden error when the technician is not in the list", () => {
    expect(() => assertCanManageInterventionOf(actorOf("technician", THIRD), [LEAD])).toThrow(
      ForbiddenError,
    );
  });
});

describe("teamOf", () => {
  it("makes the lead the only technician when no list is given", () => {
    expect(teamOf(fields())).toEqual({ technicianUserId: LEAD, technicianUserIds: [LEAD] });
  });

  it("puts the lead first followed by the other technicians", () => {
    expect(teamOf(fields({ technicianUserIds: [SECOND, THIRD] }))).toEqual({
      technicianUserId: LEAD,
      technicianUserIds: [LEAD, SECOND, THIRD],
    });
  });

  it("collapses duplicated technicians", () => {
    expect(teamOf(fields({ technicianUserIds: [LEAD, SECOND, SECOND, LEAD] }))).toEqual({
      technicianUserId: LEAD,
      technicianUserIds: [LEAD, SECOND],
    });
  });
});

describe("changedTeam", () => {
  const current = { technicianUserId: LEAD, technicianUserIds: [LEAD, SECOND] };

  it("returns nothing when the technicians do not change", () => {
    expect(changedTeam(current, { durationMinutes: 90 })).toBeUndefined();
  });

  it("makes the first technician of a new list the lead", () => {
    expect(changedTeam(current, { technicianUserIds: [THIRD, LEAD] })).toEqual({
      technicianUserId: THIRD,
      technicianUserIds: [THIRD, LEAD],
    });
  });

  it("keeps the other technicians when only the lead changes", () => {
    expect(changedTeam(current, { technicianUserId: THIRD })).toEqual({
      technicianUserId: THIRD,
      technicianUserIds: [THIRD, SECOND],
    });
  });

  it("uses the given lead before the given list", () => {
    expect(changedTeam(current, { technicianUserId: SECOND, technicianUserIds: [THIRD] })).toEqual({
      technicianUserId: SECOND,
      technicianUserIds: [SECOND, THIRD],
    });
  });

  it("collapses duplicated technicians of the new list", () => {
    expect(changedTeam(current, { technicianUserIds: [SECOND, SECOND, LEAD] })).toEqual({
      technicianUserId: SECOND,
      technicianUserIds: [SECOND, LEAD],
    });
  });

  it("reduces the visit to a single technician", () => {
    expect(changedTeam(current, { technicianUserIds: [LEAD] })).toEqual({
      technicianUserId: LEAD,
      technicianUserIds: [LEAD],
    });
  });
});

describe("checkServiceLines", () => {
  it("accepts lines whose services are all known", () => {
    expect(checkServiceLines([sweeping, stove], [SWEEPING_ID, STOVE_ID])).toEqual({
      isOk: true,
      value: [sweeping, stove],
    });
  });

  it("refuses a line whose service is unknown", () => {
    expect(checkServiceLines([sweeping, stove], [SWEEPING_ID])).toEqual({
      isOk: false,
      error: "service_not_found",
    });
  });

  it("keeps the first line of a duplicated service", () => {
    expect(
      checkServiceLines([sweeping, stove, { ...sweeping, priceCents: 1 }], [SWEEPING_ID, STOVE_ID]),
    ).toEqual({ isOk: true, value: [sweeping, stove] });
  });

  it("accepts no line at all", () => {
    expect(checkServiceLines([], [])).toEqual({ isOk: true, value: [] });
  });
});

describe("newIntervention with a team and service lines", () => {
  it("stores the team and the service lines given", () => {
    const intervention = newIntervention(fields(), {
      id: "intervention-1",
      organizationId: "organization-a",
      createdByUserId: "user-secretary",
      equipmentIds: [],
      serviceLines: [sweeping],
      team: { technicianUserId: LEAD, technicianUserIds: [LEAD, SECOND] },
      at: AT,
    });
    expect(intervention.technicianUserId).toBe(LEAD);
    expect(intervention.technicianUserIds).toEqual([LEAD, SECOND]);
    expect(intervention.serviceLines).toEqual([sweeping]);
  });

  it("defaults to the lead alone and no service line", () => {
    const intervention = newIntervention(fields(), {
      id: "intervention-1",
      organizationId: "organization-a",
      createdByUserId: "user-secretary",
      equipmentIds: [],
      at: AT,
    });
    expect(intervention.technicianUserIds).toEqual([LEAD]);
    expect(intervention.serviceLines).toEqual([]);
  });
});

describe("plannedChanges with a team and service lines", () => {
  it("leaves the team and the service lines to the checked values", () => {
    const current = newIntervention(fields(), {
      id: "intervention-1",
      organizationId: "organization-a",
      createdByUserId: "user-secretary",
      equipmentIds: [],
      at: AT,
    });
    expect(
      plannedChanges(
        current,
        {
          technicianUserId: SECOND,
          technicianUserIds: [SECOND],
          serviceLines: [sweeping],
          notes: "Chien",
        },
        AT,
      ),
    ).toEqual({ isOk: true, value: { notes: "Chien", updatedAt: AT } });
  });
});
