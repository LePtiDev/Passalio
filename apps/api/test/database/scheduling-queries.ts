import { newId } from "@passalio/shared";
import { PAGE, type CatalogedQuery } from "./cataloged-query";
import { AT, LATER } from "./domain-fixtures";
import { anIntervention } from "./field-fixtures";

const CURSOR = { updatedAt: LATER, id: newId() };

const SERVICE_ID = newId();

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
    method: "services.listActive",
    query: "active services of the organization",
    run: (r, s) => r.services.listActive(s.organization.id),
  },
  {
    method: "services.findActive",
    query: "find an active service",
    run: (r, s) => r.services.findActive(s.organization.id, SERVICE_ID),
  },
  {
    method: "services.create",
    query: "add a service",
    run: (r, s) =>
      r.services.create({
        id: newId(),
        organizationId: s.organization.id,
        name: "Ramonage de conduit",
        durationMinutes: 60,
        priceCents: 7500,
        document: "chimney_sweeping_certificate",
        trade: "chimney_sweeping",
        archivedAt: null,
        createdAt: AT,
        updatedAt: AT,
      }),
  },
  {
    method: "services.update",
    query: "change the price of a service",
    run: (r, s) =>
      r.services.update(s.organization.id, SERVICE_ID, { priceCents: 8000, updatedAt: LATER }),
  },
  {
    method: "services.archive",
    query: "archive a service",
    run: (r, s) => r.services.archive(s.organization.id, SERVICE_ID, LATER),
  },
  {
    method: "serviceCatalog.knownIds",
    query: "services of the organization chosen on an intervention",
    run: (r, s) => r.serviceCatalog.knownIds(s.organization.id, [SERVICE_ID, newId()]),
  },
];
