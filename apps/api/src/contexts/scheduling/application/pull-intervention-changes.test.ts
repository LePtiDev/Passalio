import { SYNC_PAGE_SIZE, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemorySchedulingState } from "../infrastructure/in-memory-scheduling-dependencies";
import { createIntervention } from "./create-intervention";
import { pullInterventionChanges } from "./pull-intervention-changes";
import { updateIntervention } from "./update-intervention";
import {
  actorOf,
  CUSTOMER_ID,
  FOREIGN_SITE_ID,
  interventionFields,
  ORGANIZATION_A,
  ORGANIZATION_B,
  schedulingDependenciesOf,
  seededSchedulingState,
} from "./scheduling.fixture";

let state: InMemorySchedulingState;
let dependencies: ReturnType<typeof schedulingDependenciesOf>;

const interventionIdOf = (index: number) =>
  `0190f3a0-0000-7000-8000-${String(index).padStart(12, "0")}`;

const planInterventions = (count: number) =>
  Promise.all(
    Array.from({ length: count }, (_, index) =>
      createIntervention(dependencies)(actorOf("secretary"), {
        id: interventionIdOf(index),
        intervention: interventionFields(),
      }),
    ),
  );

beforeEach(() => {
  state = seededSchedulingState();
  dependencies = schedulingDependenciesOf(state);
});

describe("pullInterventionChanges", () => {
  it.each<OrganizationRole>(["owner", "admin", "secretary", "technician"])(
    "lets the %s read the planning of the organization",
    async (role) => {
      await planInterventions(2);
      const page = await pullInterventionChanges(dependencies)(actorOf(role), undefined);
      expect(page.rows).toHaveLength(2);
    },
  );

  it("lets an impersonating actor read the planning", async () => {
    await planInterventions(1);
    const page = await pullInterventionChanges(dependencies)(
      actorOf("owner", { isImpersonating: true }),
      undefined,
    );
    expect(page.rows).toHaveLength(1);
  });

  it("returns only the interventions of the actor's organization", async () => {
    await planInterventions(2);
    await createIntervention(dependencies)(actorOf("owner", { organizationId: ORGANIZATION_B }), {
      id: interventionIdOf(99),
      intervention: interventionFields({
        siteId: FOREIGN_SITE_ID,
        customerId: CUSTOMER_ID,
        technicianUserId: "user-owner",
      }),
    });
    const page = await pullInterventionChanges(dependencies)(actorOf("technician"), undefined);
    expect(page.rows.map(({ organizationId }) => organizationId)).toEqual([
      ORGANIZATION_A,
      ORGANIZATION_A,
    ]);
    const other = await pullInterventionChanges(dependencies)(
      actorOf("owner", { organizationId: ORGANIZATION_B }),
      undefined,
    );
    expect(other.rows.map(({ id }) => id)).toEqual([interventionIdOf(99)]);
  });

  it("pages through the changes with a cursor and tells when more remain", async () => {
    await planInterventions(SYNC_PAGE_SIZE + 1);
    const first = await pullInterventionChanges(dependencies)(actorOf("secretary"), undefined);
    expect(first.rows).toHaveLength(SYNC_PAGE_SIZE);
    expect(first.hasMore).toBe(true);
    const second = await pullInterventionChanges(dependencies)(actorOf("secretary"), first.cursor);
    expect(second.rows.map(({ id }) => id)).toEqual([interventionIdOf(SYNC_PAGE_SIZE)]);
    expect(second.hasMore).toBe(false);
  });

  it("returns an intervention again after it changes", async () => {
    await planInterventions(2);
    const first = await pullInterventionChanges(dependencies)(actorOf("secretary"), undefined);
    await updateIntervention(dependencies)(actorOf("secretary"), {
      interventionId: interventionIdOf(0),
      changes: { durationMinutes: 90 },
    });
    const second = await pullInterventionChanges(dependencies)(actorOf("secretary"), first.cursor);
    expect(second.rows.map(({ id, durationMinutes }) => [id, durationMinutes])).toEqual([
      [interventionIdOf(0), 90],
    ]);
  });

  it("keeps the cursor when nothing changed", async () => {
    await planInterventions(1);
    const first = await pullInterventionChanges(dependencies)(actorOf("secretary"), undefined);
    const second = await pullInterventionChanges(dependencies)(actorOf("secretary"), first.cursor);
    expect(second).toEqual({ rows: [], cursor: first.cursor, hasMore: false });
  });
});
