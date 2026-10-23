import { PLATFORM_ROLES, prospectContactFileResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { getContactFile } from "./get-contact-file";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  getContactFile(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  state = createInMemorySalesState();
  state.companies.push(
    inMemoryCompany({
      id: "company-1",
      name: "Gaz Hop",
      city: "Alfortville",
      department: "94",
      stage: "qualified",
    }),
  );
  state.contacts.push(
    inMemoryContact({
      id: "contact-1",
      companyId: "company-1",
      firstName: "Gilles",
      lastName: "Sauvageot",
    }),
    inMemoryContact({ id: "contact-2", companyId: "company-1", lastName: "Benet" }),
    inMemoryContact({ id: "contact-orphan", companyId: "company-gone", lastName: "Orphan" }),
  );
  state.events.push(
    {
      id: "event-gilles",
      companyId: "company-1",
      contactId: "contact-1",
      authorUserId: null,
      kind: "note",
      body: "Parlé à Gilles",
      fromStage: null,
      toStage: null,
      createdAt: NOW,
    },
    {
      id: "event-benet",
      companyId: "company-1",
      contactId: "contact-2",
      authorUserId: null,
      kind: "note",
      body: "Parlé à Benet",
      fromStage: null,
      toStage: null,
      createdAt: NOW,
    },
  );
});

describe("getContactFile", () => {
  it.each(PLATFORM_ROLES)("opens a contact file to a %s", async (role) => {
    expect((await run()(platformActorWith(role), "contact-1")).isOk).toBe(true);
  });

  it("gives the contact, a summary of the company and only the history of this contact", async () => {
    const result = await run()(sales, "contact-1");
    expect(result.isOk && prospectContactFileResponse.parse(result.value)).toEqual(
      result.isOk && result.value,
    );
    expect(result.isOk && result.value.contact).toMatchObject({
      id: "contact-1",
      name: "Gilles Sauvageot",
      companyId: "company-1",
    });
    expect(result.isOk && result.value.company).toEqual({
      id: "company-1",
      name: "Gaz Hop",
      city: "Alfortville",
      department: "94",
      phone: null,
      stage: "qualified",
      owner: null,
      mainContact: { id: "contact-1", name: "Gilles Sauvageot" },
    });
    expect(result.isOk && result.value.events.map(({ id }) => id)).toEqual(["event-gilles"]);
  });

  it("answers not found for an unknown contact", async () => {
    expect(await run()(sales, "contact-unknown")).toEqual({
      isOk: false,
      error: "contact_not_found",
    });
  });

  it("answers not found for a contact whose company no longer exists", async () => {
    expect(await run()(sales, "contact-orphan")).toEqual({
      isOk: false,
      error: "contact_not_found",
    });
  });
});
