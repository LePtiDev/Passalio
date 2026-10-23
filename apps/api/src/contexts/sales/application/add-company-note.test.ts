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
import { addCompanyNote } from "./add-company-note";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  addCompanyNote(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "note-1",
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  state = createInMemorySalesState();
  state.companies.push(
    inMemoryCompany({ id: "company-1", name: "Gaz Hop", stage: "qualified" }),
    inMemoryCompany({ id: "company-2", name: "Ramonage Val" }),
  );
  state.contacts.push(
    inMemoryContact({ id: "contact-1", companyId: "company-1", lastName: "Sauvageot" }),
    inMemoryContact({ id: "contact-2", companyId: "company-2", lastName: "Benet" }),
  );
});

describe("addCompanyNote", () => {
  it.each(PLATFORM_ROLES)("lets a %s add a note", async (role) => {
    expect(await run()(platformActorWith(role), "company-1", { body: "Rappeler lundi" })).toEqual({
      isOk: true,
      value: { id: "note-1" },
    });
  });

  it("adds the note to the company history with its author and no stage change", async () => {
    await run()(sales, "company-1", { body: "Rappeler lundi" });
    expect(state.events).toEqual([
      {
        id: "note-1",
        companyId: "company-1",
        contactId: null,
        authorUserId: sales.userId,
        kind: "note",
        body: "Rappeler lundi",
        fromStage: null,
        toStage: null,
        createdAt: NOW,
      },
    ]);
    expect(state.companies[0]?.stage).toBe("qualified");
  });

  it("links the note to a contact of the company", async () => {
    await run()(sales, "company-1", { body: "Parlé au gérant", contactId: "contact-1" });
    expect(state.events[0]?.contactId).toBe("contact-1");
  });

  it("refuses a contact of another company", async () => {
    expect(
      await run()(sales, "company-1", { body: "Parlé au gérant", contactId: "contact-2" }),
    ).toEqual({ isOk: false, error: "contact_not_in_company" });
    expect(state.events).toEqual([]);
  });

  it("refuses an unknown contact", async () => {
    expect(
      await run()(sales, "company-1", { body: "Parlé au gérant", contactId: "contact-unknown" }),
    ).toEqual({ isOk: false, error: "contact_not_in_company" });
  });

  it("answers not found for an unknown company", async () => {
    expect(await run()(sales, "company-unknown", { body: "Rappeler lundi" })).toEqual({
      isOk: false,
      error: "company_not_found",
    });
    expect(state.events).toEqual([]);
  });
});
