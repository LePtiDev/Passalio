import { newId } from "@passalio/shared";
import { PAGE, type CatalogedQuery } from "./cataloged-query";
import { LATER } from "./domain-fixtures";
import { anIntervention } from "./field-fixtures";

const CURSOR = { updatedAt: LATER, id: newId() };

export const SCHEDULING_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "interventions.exists",
    query: "intervention id already used",
    run: (r, s) => r.interventions.exists(s.intervention.id),
  },
  {
    method: "interventions.create",
    query: "plan an intervention",
    run: (r, s) =>
      r.interventions.create(
        anIntervention(
          s.organization.id,
          { customerId: s.customer.id, siteId: s.site.id, equipmentId: s.equipment.id },
          s.technician.id,
        ),
      ),
  },
  {
    method: "interventions.findById",
    query: "find an intervention",
    run: (r, s) => r.interventions.findById(s.organization.id, s.intervention.id),
  },
  {
    method: "interventions.update",
    query: "move an intervention to another day",
    run: (r, s) =>
      r.interventions.update(s.organization.id, s.intervention.id, {
        scheduledDate: "2026-10-29",
        equipmentIds: [s.equipment.id],
        updatedAt: LATER,
      }),
  },
  {
    method: "interventions.changesAfter",
    query: "first sync page of interventions",
    run: (r, s) => r.interventions.changesAfter(s.organization.id, undefined, PAGE),
  },
  {
    method: "interventions.changesAfter",
    query: "next sync page of interventions after a cursor",
    run: (r, s) => r.interventions.changesAfter(s.organization.id, CURSOR, PAGE),
  },
  {
    method: "interventionPlaces.siteOf",
    query: "customer and active equipments of the intervention site",
    run: (r, s) => r.interventionPlaces.siteOf(s.organization.id, s.site.id),
  },
  {
    method: "teamMembers.isMember",
    query: "assigned technician belongs to the organization",
    run: (r, s) => r.teamMembers.isMember(s.organization.id, s.technician.id),
  },
  {
    method: "visitTypeSettings.find",
    query: "trades and visit durations of the organization",
    run: (r, s) => r.visitTypeSettings.find(s.organization.id),
  },
  {
    method: "visitTypeSettings.saveDurations",
    query: "save the visit durations of the organization",
    run: (r, s) => r.visitTypeSettings.saveDurations(s.organization.id, { chimney_sweeping: 75 }),
  },
];
