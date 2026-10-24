import { PLATFORM_ROLES, prospectFollowUpResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { inMemoryCall, inMemoryTask } from "./call-test-fixtures";
import { CALL_HISTORY_LIMIT, getFollowUp } from "./get-follow-up";

const NOW = new Date("2026-10-24T08:00:00Z");
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

let state: InMemorySalesState;
const run = () =>
  getFollowUp(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  state = createInMemorySalesState();
  state.people.push({ id: "user-antho", name: "Antho" });
  state.companies.push(
    inMemoryCompany({ id: "company-1", name: "Gaz Hop", city: "Alfortville", phone: "0143" }),
    inMemoryCompany({ id: "company-2", name: "Ramonage Val" }),
  );
  state.contacts.push(
    inMemoryContact({
      id: "contact-1",
      companyId: "company-1",
      firstName: "Gilles",
      lastName: "Sauvageot",
    }),
  );
});

describe("getFollowUp", () => {
  it.each(PLATFORM_ROLES)("opens the follow-up of a company to a %s", async (role) => {
    expect((await run()(platformActorWith(role), "company-1")).isOk).toBe(true);
  });

  it("gives an empty follow-up for a company never called", async () => {
    expect(await run()(sales, "company-1")).toEqual({
      isOk: true,
      value: {
        qualification: {
          interest: null,
          teamSize: null,
          toolKind: null,
          certificateVolume: null,
          decisionMaker: null,
        },
        lastCall: null,
        calls: [],
        tasks: [],
      },
    });
  });

  it("gives the qualification, the calls newest first and the open tasks soonest first", async () => {
    state.followUps.push({
      companyId: "company-1",
      lastCallAt: minutesAgo(5),
      lastCallOutcome: "answered",
      lastCallByUserId: "user-antho",
      interest: "warm",
      teamSize: "four_plus",
      toolKind: "software",
      certificateVolume: "over_800",
      decisionMaker: "partner",
      updatedAt: minutesAgo(5),
    });
    state.calls.push(
      inMemoryCall({
        id: "call-old",
        companyId: "company-1",
        calledAt: minutesAgo(60),
        outcome: "no_answer",
      }),
      inMemoryCall({
        id: "call-new",
        companyId: "company-1",
        calledAt: minutesAgo(5),
        authorUserId: "user-antho",
        contactId: "contact-1",
        nextAction: "callback",
        notes: "Rappeler mardi",
      }),
      inMemoryCall({ id: "call-other", companyId: "company-2", calledAt: minutesAgo(1) }),
    );
    state.tasks.push(
      inMemoryTask({
        id: "task-late",
        companyId: "company-1",
        dueAt: new Date("2026-10-28T09:00:00Z"),
      }),
      inMemoryTask({
        id: "task-soon",
        companyId: "company-1",
        dueAt: new Date("2026-10-27T09:00:00Z"),
        ownerUserId: "user-antho",
        contactId: "contact-1",
        notify: "at_time",
        notifyAt: new Date("2026-10-27T09:00:00Z"),
      }),
      inMemoryTask({
        id: "task-done",
        companyId: "company-1",
        dueAt: minutesAgo(10),
        status: "done",
      }),
      inMemoryTask({ id: "task-other", companyId: "company-2", dueAt: minutesAgo(10) }),
    );
    const result = await run()(sales, "company-1");
    expect(result.isOk && prospectFollowUpResponse.parse(result.value)).toEqual({
      qualification: {
        interest: "warm",
        teamSize: "four_plus",
        toolKind: "software",
        certificateVolume: "over_800",
        decisionMaker: "partner",
      },
      lastCall: {
        at: minutesAgo(5).toISOString(),
        outcome: "answered",
        by: { id: "user-antho", name: "Antho" },
      },
      calls: [
        {
          id: "call-new",
          contact: { id: "contact-1", name: "Gilles Sauvageot" },
          author: { id: "user-antho", name: "Antho" },
          outcome: "answered",
          nextAction: "callback",
          notes: "Rappeler mardi",
          calledAt: minutesAgo(5).toISOString(),
        },
        {
          id: "call-old",
          contact: null,
          author: null,
          outcome: "no_answer",
          nextAction: null,
          notes: null,
          calledAt: minutesAgo(60).toISOString(),
        },
      ],
      tasks: [
        {
          id: "task-soon",
          kind: "callback",
          status: "open",
          dueAt: "2026-10-27T09:00:00.000Z",
          notify: "at_time",
          notifyAt: "2026-10-27T09:00:00.000Z",
          owner: { id: "user-antho", name: "Antho" },
          contact: { id: "contact-1", name: "Gilles Sauvageot" },
          company: { id: "company-1", name: "Gaz Hop", city: "Alfortville", phone: "0143" },
        },
        expect.objectContaining({ id: "task-late" }),
      ],
    });
  });

  it(`keeps only the ${CALL_HISTORY_LIMIT} latest calls`, async () => {
    state.calls.push(
      ...Array.from({ length: CALL_HISTORY_LIMIT + 3 }, (_, index) =>
        inMemoryCall({ id: `call-${index}`, companyId: "company-1", calledAt: minutesAgo(index) }),
      ),
    );
    const result = await run()(sales, "company-1");
    expect(result.isOk && result.value.calls.map(({ id }) => id)).toEqual(
      Array.from({ length: CALL_HISTORY_LIMIT }, (_, index) => `call-${index}`),
    );
  });

  it("answers not found for an unknown company", async () => {
    expect(await run()(sales, "company-unknown")).toEqual({
      isOk: false,
      error: "company_not_found",
    });
  });
});
