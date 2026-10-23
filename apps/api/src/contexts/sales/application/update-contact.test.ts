import { PLATFORM_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { updateContact } from "./update-contact";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  updateContact(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  state = createInMemorySalesState();
  state.contacts.push(
    inMemoryContact({
      id: "contact-1",
      companyId: "company-1",
      firstName: "Gilles",
      lastName: "Sauvageot",
      phone: "0102030405",
    }),
  );
});

describe("updateContact", () => {
  it.each(PLATFORM_ROLES)("lets a %s update a contact", async (role) => {
    expect(await run()(platformActorWith(role), "contact-1", { jobTitle: "Gérant" })).toEqual({
      isOk: true,
      value: null,
    });
    expect(state.contacts[0]?.jobTitle).toBe("Gérant");
  });

  it("keeps the fields left out and dates the change", async () => {
    await run()(sales, "contact-1", { email: "gilles@gazhop.fr" });
    expect(state.contacts[0]).toMatchObject({
      firstName: "Gilles",
      lastName: "Sauvageot",
      phone: "0102030405",
      email: "gilles@gazhop.fr",
      updatedAt: NOW,
    });
  });

  it("keeps the search name in line with a new last name", async () => {
    await run()(sales, "contact-1", { lastName: "Élie" });
    expect(state.contacts[0]?.searchName).toBe("elie gilles");
  });

  it("keeps the search name in line with a cleared first name", async () => {
    await run()(sales, "contact-1", { firstName: null });
    expect(state.contacts[0]?.searchName).toBe("sauvageot");
  });

  it("answers not found for an unknown contact", async () => {
    expect(await run()(sales, "contact-unknown", { jobTitle: "Gérant" })).toEqual({
      isOk: false,
      error: "contact_not_found",
    });
  });
});
