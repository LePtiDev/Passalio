import { describe, expect, it } from "vitest";
import type { CustomerRecord, InterventionRecord } from "@/lib/db/local-records";
import { serverDocumentRecord, serverInterventionRecord } from "@/lib/sync/planning-test-records";
import {
  serverCustomerRecord,
  serverEquipmentRecord,
  serverSiteRecord,
} from "@/lib/sync/sync-test-records";
import {
  nextVisitOf,
  shortNameOf,
  totalAnnouncedCents,
  visitsOf,
  type PlanningRecords,
  type PlanningVisit,
} from "./planning-visits";

const individual = (id: string, firstName: string, lastName: string): CustomerRecord => ({
  ...serverCustomerRecord(id, lastName),
  firstName,
});

const company = (id: string, companyName: string): CustomerRecord => ({
  ...serverCustomerRecord(id, companyName),
  kind: "company",
  lastName: null,
  companyName,
});

const recordsOf = (
  interventions: readonly InterventionRecord[],
  overrides: Partial<PlanningRecords> = {},
): PlanningRecords => ({
  interventions,
  customers: [individual("customer-1", "Élodie", "Lefèvre"), company("customer-2", "Boulangerie")],
  sites: [serverSiteRecord("site-1", "customer-1")],
  equipments: [serverEquipmentRecord("equipment-1", "site-1")],
  documents: [],
  pending: new Set(),
  ...overrides,
});

const visit = (id: string, startTime: string | null, overrides: Partial<InterventionRecord> = {}) =>
  serverInterventionRecord(id, { startTime, ...overrides });

const onlyVisit = (records: PlanningRecords): PlanningVisit => {
  const [first] = visitsOf(records);
  if (first === undefined) {
    throw new Error("no visit");
  }
  return first;
};

describe("visitsOf", () => {
  it("hides cancelled visits", () => {
    const visits = visitsOf(
      recordsOf([visit("kept", "09:00"), visit("cancelled", "10:00", { status: "cancelled" })]),
    );
    expect(visits.map(({ id }) => id)).toEqual(["kept"]);
  });

  it("sorts visits by start time", () => {
    const visits = visitsOf(
      recordsOf([visit("afternoon", "14:00"), visit("early", "08:30"), visit("late", "17:45")]),
    );
    expect(visits.map(({ id }) => id)).toEqual(["early", "afternoon", "late"]);
  });

  it("sorts visits at the same time by customer name", () => {
    const visits = visitsOf(
      recordsOf([
        visit("lefevre", "09:00", { customerId: "customer-1" }),
        visit("boulangerie", "09:00", { customerId: "customer-2" }),
      ]),
    );
    expect(visits.map(({ id }) => id)).toEqual(["boulangerie", "lefevre"]);
  });

  it("keeps visits without a time, with no start minutes", () => {
    const visits = visitsOf(recordsOf([visit("timed", "09:00"), visit("untimed", null)]));
    expect(visits.find(({ id }) => id === "untimed")?.startMinutes).toBeNull();
    expect(visits.find(({ id }) => id === "timed")?.startMinutes).toBe(540);
  });

  it("joins the customer, the site and the equipment names", () => {
    const shown = onlyVisit(
      recordsOf([visit("v", "09:00", { equipmentIds: ["equipment-1", "equipment-gone"] })]),
    );
    expect(shown.customerName).toBe("Élodie Lefèvre");
    expect(shown.shortName).toBe("É. Lefèvre");
    expect(shown.site?.id).toBe("site-1");
    expect(shown.equipmentNames).toHaveLength(1);
    expect(shown.durationMinutes).toBe(60);
  });

  it("still shows a visit whose customer is not cached yet", () => {
    const shown = onlyVisit(recordsOf([visit("v", "09:00", { customerId: "customer-unknown" })]));
    expect(shown.customer).toBeNull();
    expect(shown.customerName).toBe("");
  });

  it("marks a completed visit as done", () => {
    expect(onlyVisit(recordsOf([visit("v", "09:00", { status: "completed" })])).isDone).toBe(true);
  });

  it("marks a visit as done when every equipment has a signed document", () => {
    const shown = onlyVisit(
      recordsOf([visit("v", "09:00", { equipmentIds: ["equipment-1", "equipment-2"] })], {
        documents: [
          serverDocumentRecord("document-1", "v", "equipment-1"),
          serverDocumentRecord("document-2", "v", "equipment-2"),
        ],
      }),
    );
    expect(shown.isDone).toBe(true);
  });

  it("does not mark a visit as done while one equipment is still unsigned", () => {
    const shown = onlyVisit(
      recordsOf([visit("v", "09:00", { equipmentIds: ["equipment-1", "equipment-2"] })], {
        documents: [serverDocumentRecord("document-1", "v", "equipment-1")],
      }),
    );
    expect(shown.isDone).toBe(false);
  });

  it("ignores documents signed for another visit", () => {
    const shown = onlyVisit(
      recordsOf([visit("v", "09:00", { equipmentIds: ["equipment-1"] })], {
        documents: [serverDocumentRecord("document-1", "other", "equipment-1")],
      }),
    );
    expect(shown.isDone).toBe(false);
  });

  it("does not mark a planned visit without equipment as done", () => {
    expect(onlyVisit(recordsOf([visit("v", "09:00")])).isDone).toBe(false);
  });

  it("marks a visit still waiting to be sent as pending", () => {
    const visits = visitsOf(
      recordsOf([visit("waiting", "09:00"), visit("sent", "10:00")], {
        pending: new Set(["waiting"]),
      }),
    );
    expect(visits.map(({ id, isPending }) => ({ id, isPending }))).toEqual([
      { id: "waiting", isPending: true },
      { id: "sent", isPending: false },
    ]);
  });
});

describe("shortNameOf", () => {
  it("shortens an individual to the first initial and last name", () => {
    expect(shortNameOf(individual("c", "élodie", "Lefèvre"))).toBe("É. Lefèvre");
  });

  it("keeps a company name whole", () => {
    expect(shortNameOf(company("c", "Boulangerie Martin"))).toBe("Boulangerie Martin");
  });

  it("keeps the last name alone when the first name is missing", () => {
    expect(shortNameOf(serverCustomerRecord("c", "Lefèvre"))).toBe("Lefèvre");
  });
});

describe("totalAnnouncedCents", () => {
  it("adds the announced prices and counts missing prices as zero", () => {
    const visits = visitsOf(
      recordsOf([
        visit("a", "09:00", { announcedPriceCents: 7500 }),
        visit("b", "10:00", { announcedPriceCents: null }),
        visit("c", "11:00", { announcedPriceCents: 8550 }),
      ]),
    );
    expect(totalAnnouncedCents(visits)).toBe(16050);
  });

  it("leaves cancelled visits out of the total", () => {
    const visits = visitsOf(
      recordsOf([
        visit("a", "09:00", { announcedPriceCents: 7500 }),
        visit("b", "10:00", { announcedPriceCents: 9000, status: "cancelled" }),
      ]),
    );
    expect(totalAnnouncedCents(visits)).toBe(7500);
  });

  it("is zero for an empty day", () => {
    expect(totalAnnouncedCents([])).toBe(0);
  });
});

describe("nextVisitOf", () => {
  const day = visitsOf(
    recordsOf([
      visit("first", "09:00"),
      visit("second", "11:00"),
      visit("third", "14:00", { durationMinutes: 90 }),
    ]),
  );

  it("says there is no visit on an empty day", () => {
    expect(nextVisitOf([], 600)).toEqual({ kind: "none" });
  });

  it("shows the first visit as later before the day starts", () => {
    expect(nextVisitOf(day, 7 * 60)).toMatchObject({ kind: "later", visit: { id: "first" } });
  });

  it("shows the visit in progress as now", () => {
    expect(nextVisitOf(day, 9 * 60 + 30)).toMatchObject({ kind: "now", visit: { id: "first" } });
  });

  it("shows a visit as now from its very first minute", () => {
    expect(nextVisitOf(day, 11 * 60)).toMatchObject({ kind: "now", visit: { id: "second" } });
  });

  it("moves to the next visit once the current one has ended", () => {
    expect(nextVisitOf(day, 10 * 60)).toMatchObject({ kind: "later", visit: { id: "second" } });
  });

  it("skips visits that are already done", () => {
    const visits = visitsOf(
      recordsOf([visit("done", "09:00", { status: "completed" }), visit("next", "11:00")]),
    );
    expect(nextVisitOf(visits, 9 * 60 + 30)).toMatchObject({
      kind: "later",
      visit: { id: "next" },
    });
  });

  it("says the day is finished once every visit has ended", () => {
    expect(nextVisitOf(day, 15 * 60 + 30)).toEqual({ kind: "finished" });
  });

  it("says the day is finished when every visit is done", () => {
    const visits = visitsOf(recordsOf([visit("done", "18:00", { status: "completed" })]));
    expect(nextVisitOf(visits, 8 * 60)).toEqual({ kind: "finished" });
  });

  it("shows the first visit as later on a day other than today", () => {
    expect(nextVisitOf(day, null)).toMatchObject({ kind: "later", visit: { id: "first" } });
  });

  it("keeps a visit without a time as upcoming", () => {
    const visits = visitsOf(recordsOf([visit("untimed", null)]));
    expect(nextVisitOf(visits, 23 * 60)).toMatchObject({
      kind: "later",
      visit: { id: "untimed" },
    });
  });
});
