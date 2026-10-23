import { PLATFORM_ROLES, prospectContactResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { addContact } from "./add-contact";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  addContact(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "contact-1",
    ),
  );
const sales = platformActorWith("sales");

beforeEach(() => {
  state = createInMemorySalesState();
  state.companies.push(inMemoryCompany({ id: "company-1", name: "Gaz Hop" }));
});

describe("addContact", () => {
  it.each(PLATFORM_ROLES)("lets a %s add a contact", async (role) => {
    const result = await run()(platformActorWith(role), "company-1", { lastName: "Benet" });
    expect(result.isOk).toBe(true);
    expect(state.contacts.map(({ id }) => id)).toEqual(["contact-1"]);
  });

  it("stores the contact, sortable by last name, and answers it with its full name", async () => {
    const result = await run()(sales, "company-1", {
      firstName: "Gilles",
      lastName: "Sauvageot",
      jobTitle: "Gérant",
      isLeader: true,
      isMain: true,
      phone: "0102030405",
      mobile: "0607080910",
      email: "gilles@gazhop.fr",
      bestTime: "Le matin",
    });
    expect(state.contacts[0]).toEqual({
      id: "contact-1",
      companyId: "company-1",
      firstName: "Gilles",
      lastName: "Sauvageot",
      searchName: "sauvageot gilles",
      jobTitle: "Gérant",
      isLeader: true,
      isMain: true,
      phone: "0102030405",
      mobile: "0607080910",
      email: "gilles@gazhop.fr",
      bestTime: "Le matin",
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(result).toEqual({
      isOk: true,
      value: {
        id: "contact-1",
        companyId: "company-1",
        name: "Gilles Sauvageot",
        firstName: "Gilles",
        lastName: "Sauvageot",
        jobTitle: "Gérant",
        isLeader: true,
        isMain: true,
        phone: "0102030405",
        mobile: "0607080910",
        email: "gilles@gazhop.fr",
        bestTime: "Le matin",
      },
    });
    expect(result.isOk && prospectContactResponse.parse(result.value)).toEqual(
      result.isOk && result.value,
    );
  });

  it("stores a contact with only a last name as neither leader nor main", async () => {
    const result = await run()(sales, "company-1", { lastName: "Benet" });
    expect(state.contacts[0]).toMatchObject({
      firstName: null,
      searchName: "benet",
      jobTitle: null,
      isLeader: false,
      isMain: false,
      phone: null,
      mobile: null,
      email: null,
      bestTime: null,
    });
    expect(result.isOk && result.value.name).toBe("Benet");
  });

  it("answers not found for an unknown company", async () => {
    expect(await run()(sales, "company-unknown", { lastName: "Benet" })).toEqual({
      isOk: false,
      error: "company_not_found",
    });
    expect(state.contacts).toEqual([]);
  });
});
