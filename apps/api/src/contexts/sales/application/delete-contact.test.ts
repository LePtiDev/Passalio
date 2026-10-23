import { PLATFORM_ROLES } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { deleteContact } from "./delete-contact";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  deleteContact(
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
    inMemoryContact({ id: "contact-1", companyId: "company-1", lastName: "Sauvageot" }),
    inMemoryContact({ id: "contact-2", companyId: "company-1", lastName: "Benet" }),
  );
});

describe("deleteContact", () => {
  it.each(PLATFORM_ROLES)("lets a %s delete a contact", async (role) => {
    expect(await run()(platformActorWith(role), "contact-1")).toEqual({ isOk: true, value: null });
    expect(state.contacts.map(({ id }) => id)).toEqual(["contact-2"]);
  });

  it("answers not found for an unknown contact", async () => {
    expect(await run()(sales, "contact-unknown")).toEqual({
      isOk: false,
      error: "contact_not_found",
    });
    expect(state.contacts).toHaveLength(2);
  });

  it("answers not found when the contact is deleted twice", async () => {
    await run()(sales, "contact-1");
    expect(await run()(sales, "contact-1")).toEqual({ isOk: false, error: "contact_not_found" });
  });
});
