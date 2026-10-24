import { PLATFORM_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { logCall } from "./log-call";

const NOW = new Date("2026-10-24T08:00:00Z");
const DUE_AT = "2026-10-27T09:30:00.000Z";

let state: InMemorySalesState;
let ids: number;
const run = () =>
  logCall(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => `id-${++ids}`,
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  ids = 0;
  state = createInMemorySalesState();
  state.companies.push(
    inMemoryCompany({ id: "company-1", name: "Gaz Hop" }),
    inMemoryCompany({ id: "company-2", name: "Ramonage Val", stage: "customer" }),
  );
  state.contacts.push(
    inMemoryContact({ id: "contact-1", companyId: "company-1", lastName: "Sauvageot" }),
    inMemoryContact({ id: "contact-2", companyId: "company-2", lastName: "Benet" }),
  );
});

describe("logCall", () => {
  it.each(PLATFORM_ROLES)("lets a %s log a call", async (role) => {
    const result = await run()(platformActorWith(role), "company-1", { outcome: "no_answer" });
    expect(result.isOk).toBe(true);
  });

  it("records the call with its author, contact, outcome, next action and notes", async () => {
    await run()(sales, "company-1", {
      contactId: "contact-1",
      outcome: "answered",
      nextAction: "email",
      notes: "Veut la plaquette",
    });
    expect(state.calls).toEqual([
      {
        id: "id-1",
        companyId: "company-1",
        contactId: "contact-1",
        authorUserId: sales.userId,
        outcome: "answered",
        nextAction: "email",
        notes: "Veut la plaquette",
        calledAt: NOW,
      },
    ]);
    expect(state.tasks).toEqual([]);
  });

  it("keeps the last call on the follow-up of the company", async () => {
    await run()(sales, "company-1", { outcome: "voicemail" });
    expect(state.followUps).toEqual([
      {
        companyId: "company-1",
        lastCallAt: NOW,
        lastCallOutcome: "voicemail",
        lastCallByUserId: sales.userId,
        interest: null,
        teamSize: null,
        toolKind: null,
        certificateVolume: null,
        decisionMaker: null,
        updatedAt: NOW,
      },
    ]);
  });

  it("keeps the qualification when a new call is logged", async () => {
    state.followUps.push({
      companyId: "company-1",
      lastCallAt: null,
      lastCallOutcome: null,
      lastCallByUserId: null,
      interest: "hot",
      teamSize: "solo",
      toolKind: "paper",
      certificateVolume: "under_300",
      decisionMaker: "manager",
      updatedAt: new Date("2026-10-01T00:00:00Z"),
    });
    await run()(sales, "company-1", { outcome: "no_answer" });
    expect(state.followUps).toMatchObject([
      { interest: "hot", teamSize: "solo", lastCallOutcome: "no_answer", lastCallAt: NOW },
    ]);
  });

  it("plans a callback for the author with its notification time", async () => {
    const result = await run()(sales, "company-1", {
      contactId: "contact-1",
      outcome: "answered",
      nextAction: "callback",
      schedule: { dueAt: DUE_AT, notify: "minutes_15" },
    });
    expect(result).toEqual({
      isOk: true,
      value: { id: "id-2", taskId: "id-1", stage: "qualified" },
    });
    expect(state.tasks).toEqual([
      {
        id: "id-1",
        companyId: "company-1",
        contactId: "contact-1",
        ownerUserId: sales.userId,
        kind: "callback",
        dueAt: new Date(DUE_AT),
        notify: "minutes_15",
        notifyAt: new Date("2026-10-27T09:15:00Z"),
        notifiedAt: null,
        status: "open",
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);
  });

  it("plans a demo and moves the company to demo planned with a history line", async () => {
    await run()(sales, "company-1", {
      outcome: "answered",
      nextAction: "demo",
      schedule: { dueAt: DUE_AT, notify: "none" },
    });
    expect(state.tasks).toMatchObject([{ kind: "demo", notifyAt: null }]);
    expect(state.companies[0]?.stage).toBe("demo_planned");
    expect(state.events).toEqual([
      {
        id: "id-3",
        companyId: "company-1",
        contactId: null,
        authorUserId: sales.userId,
        kind: "stage_changed",
        body: null,
        fromStage: "to_qualify",
        toStage: "demo_planned",
        createdAt: NOW,
      },
    ]);
  });

  it("closes the company as not interested", async () => {
    const result = await run()(sales, "company-1", {
      outcome: "answered",
      nextAction: "not_interested",
    });
    expect(result).toMatchObject({ isOk: true, value: { stage: "not_interested", taskId: null } });
    expect(state.companies[0]?.stage).toBe("not_interested");
  });

  it("leaves the stage and the history alone when nobody answered", async () => {
    const result = await run()(sales, "company-1", { outcome: "no_answer" });
    expect(result).toMatchObject({ isOk: true, value: { stage: "to_qualify" } });
    expect(state.events).toEqual([]);
  });

  it("never moves a customer", async () => {
    await run()(sales, "company-2", {
      outcome: "answered",
      nextAction: "not_interested",
    });
    expect(state.companies[1]?.stage).toBe("customer");
    expect(state.events).toEqual([]);
  });

  it("refuses a contact of another company and records nothing", async () => {
    expect(
      await run()(sales, "company-1", { contactId: "contact-2", outcome: "answered" }),
    ).toEqual({ isOk: false, error: "contact_not_in_company" });
    expect(state.calls).toEqual([]);
    expect(state.followUps).toEqual([]);
  });

  it("answers not found for an unknown company", async () => {
    expect(await run()(sales, "company-unknown", { outcome: "answered" })).toEqual({
      isOk: false,
      error: "company_not_found",
    });
    expect(state.calls).toEqual([]);
  });
});
