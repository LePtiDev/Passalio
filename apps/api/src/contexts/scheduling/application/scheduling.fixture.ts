import type { Actor, InterventionFields, OrganizationRole } from "@passalio/shared";
import {
  createInMemorySchedulingDependencies,
  createInMemorySchedulingState,
  memberKey,
  type InMemorySchedulingState,
} from "../infrastructure/in-memory-scheduling-dependencies";

export const ORGANIZATION_A = "organization-a";
export const ORGANIZATION_B = "organization-b";
export const CUSTOMER_ID = "0190f3a0-0000-7000-8000-0000000000c1";
export const OTHER_CUSTOMER_ID = "0190f3a0-0000-7000-8000-0000000000c2";
export const SITE_ID = "0190f3a0-0000-7000-8000-0000000000a1";
export const OTHER_SITE_ID = "0190f3a0-0000-7000-8000-0000000000b1";
export const FOREIGN_SITE_ID = "0190f3a0-0000-7000-8000-0000000000f1";
export const EQUIPMENT_ID = "0190f3a0-0000-7000-8000-0000000000e1";
export const SECOND_EQUIPMENT_ID = "0190f3a0-0000-7000-8000-0000000000e2";
export const OTHER_SITE_EQUIPMENT_ID = "0190f3a0-0000-7000-8000-0000000000e3";
export const INTERVENTION_ID = "0190f3a0-0000-7000-8000-000000000101";
export const TECHNICIAN_ID = "user-technician";
export const OTHER_TECHNICIAN_ID = "user-other-technician";
export const OUTSIDER_ID = "user-outsider";

export const actorOf = (
  role: OrganizationRole,
  overrides: Partial<Omit<Actor, "role">> = {},
): Actor => ({
  userId: `user-${role}`,
  organizationId: ORGANIZATION_A,
  isImpersonating: false,
  ...overrides,
  role,
});

export const seededSchedulingState = (): InMemorySchedulingState => {
  const state = createInMemorySchedulingState();
  state.places.set(SITE_ID, {
    organizationId: ORGANIZATION_A,
    customerId: CUSTOMER_ID,
    equipmentIds: [EQUIPMENT_ID, SECOND_EQUIPMENT_ID],
  });
  state.places.set(OTHER_SITE_ID, {
    organizationId: ORGANIZATION_A,
    customerId: OTHER_CUSTOMER_ID,
    equipmentIds: [OTHER_SITE_EQUIPMENT_ID],
  });
  state.places.set(FOREIGN_SITE_ID, {
    organizationId: ORGANIZATION_B,
    customerId: CUSTOMER_ID,
    equipmentIds: [EQUIPMENT_ID],
  });
  for (const userId of [
    "user-owner",
    "user-admin",
    "user-secretary",
    TECHNICIAN_ID,
    OTHER_TECHNICIAN_ID,
  ]) {
    state.members.add(memberKey(ORGANIZATION_A, userId));
  }
  state.members.add(memberKey(ORGANIZATION_B, "user-owner"));
  state.members.add(memberKey(ORGANIZATION_B, OUTSIDER_ID));
  return state;
};

export const schedulingDependenciesOf = (state: InMemorySchedulingState) => {
  let clock = Date.parse("2026-10-23T10:00:00Z");
  return createInMemorySchedulingDependencies(state, () => new Date((clock += 1000)));
};

export const interventionFields = (
  overrides: Partial<InterventionFields> = {},
): InterventionFields => ({
  customerId: CUSTOMER_ID,
  siteId: SITE_ID,
  technicianUserId: TECHNICIAN_ID,
  scheduledDate: "2026-10-28",
  startTime: "09:00",
  durationMinutes: 60,
  equipmentIds: [EQUIPMENT_ID],
  announcedPriceCents: 8000,
  notes: null,
  ...overrides,
});
