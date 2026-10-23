import { PLATFORM_ROLES, prospectCompanyFileResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { getCompanyFile, HISTORY_LIMIT } from "./get-company-file";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  getCompanyFile(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

beforeEach(() => {
  state = createInMemorySalesState();
  state.people.push({ id: "user-antho", name: "Antho" });
  state.companies.push(
    inMemoryCompany({
      id: "company-1",
      name: "Gaz Hop",
      ownerUserId: "user-antho",
      stage: "interested",
    }),
    inMemoryCompany({ id: "company-2", name: "Ramonage Val" }),
  );
  state.contacts.push(
    inMemoryContact({
      id: "contact-1",
      companyId: "company-1",
      firstName: "Gilles",
      lastName: "Sauvageot",
      isMain: true,
    }),
    inMemoryContact({ id: "contact-2", companyId: "company-2", lastName: "Benet" }),
  );
});

describe("getCompanyFile", () => {
  it.each(PLATFORM_ROLES)("opens a company file to a %s", async (role) => {
    expect((await run()(platformActorWith(role), "company-1")).isOk).toBe(true);
  });

  it("gives the company with its owner, its contacts and its history, newest first", async () => {
    state.events.push(
      {
        id: "event-old",
        companyId: "company-1",
        contactId: null,
        authorUserId: "user-antho",
        kind: "stage_changed",
        body: null,
        fromStage: "qualified",
        toStage: "interested",
        createdAt: minutesAgo(10),
      },
      {
        id: "event-new",
        companyId: "company-1",
        contactId: "contact-1",
        authorUserId: "user-antho",
        kind: "note",
        body: "Rappeler lundi",
        fromStage: null,
        toStage: null,
        createdAt: minutesAgo(1),
      },
      {
        id: "event-other",
        companyId: "company-2",
        contactId: null,
        authorUserId: null,
        kind: "note",
        body: "Autre",
        fromStage: null,
        toStage: null,
        createdAt: minutesAgo(1),
      },
    );
    const result = await run()(sales, "company-1");
    expect(result.isOk && prospectCompanyFileResponse.parse(result.value)).toEqual(
      result.isOk && result.value,
    );
    expect(result.isOk && result.value.company).toMatchObject({
      id: "company-1",
      name: "Gaz Hop",
      stage: "interested",
      owner: { id: "user-antho", name: "Antho" },
    });
    expect(result.isOk && result.value.contacts.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: "contact-1", name: "Gilles Sauvageot" },
    ]);
    expect(result.isOk && result.value.events).toEqual([
      {
        id: "event-new",
        kind: "note",
        body: "Rappeler lundi",
        fromStage: null,
        toStage: null,
        createdAt: minutesAgo(1).toISOString(),
        authorName: "Antho",
        contact: { id: "contact-1", name: "Gilles Sauvageot" },
      },
      {
        id: "event-old",
        kind: "stage_changed",
        body: null,
        fromStage: "qualified",
        toStage: "interested",
        createdAt: minutesAgo(10).toISOString(),
        authorName: "Antho",
        contact: null,
      },
    ]);
  });

  it("shows the last 100 events at most", async () => {
    expect(HISTORY_LIMIT).toBe(100);
    Array.from({ length: HISTORY_LIMIT + 1 }, (_, index) =>
      state.events.push({
        id: `event-${String(index).padStart(3, "0")}`,
        companyId: "company-1",
        contactId: null,
        authorUserId: null,
        kind: "note",
        body: `Note ${index}`,
        fromStage: null,
        toStage: null,
        createdAt: minutesAgo(index),
      }),
    );
    const result = await run()(sales, "company-1");
    expect(result.isOk && result.value.events).toHaveLength(100);
    expect(result.isOk && result.value.events.at(-1)?.id).toBe("event-099");
  });

  it("shows no owner when nobody follows the company", async () => {
    const result = await run()(sales, "company-2");
    expect(result.isOk && result.value.company.owner).toBeNull();
  });

  it("answers not found for an unknown company", async () => {
    expect(await run()(sales, "company-unknown")).toEqual({
      isOk: false,
      error: "company_not_found",
    });
  });
});
