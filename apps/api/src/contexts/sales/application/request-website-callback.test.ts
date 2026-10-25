import type { PublicCallbackRequest } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Visitor } from "../domain/website-callback-ports";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { requestWebsiteCallback } from "./request-website-callback";

const NOW = new Date("2026-10-24T15:00:00Z");
const VISITOR: Visitor = { ipAddress: "198.51.100.7" };

const REQUEST: PublicCallbackRequest = {
  firstName: "Paul",
  company: "Ramonage Paul",
  phone: "0612345678",
  postalCode: "94100",
  slot: "morning",
  message: null,
  pagePath: "/",
  turnstileToken: "token",
};

let state: InMemorySalesState;
let isHuman: boolean;
let isAllowed: boolean;
let checkedTokens: string[];
let counter: number;

const run = (request: PublicCallbackRequest = REQUEST) =>
  requestWebsiteCallback({
    ...createInMemorySalesDependencies(
      state,
      () => NOW,
      () => {
        counter += 1;
        return `id-${counter}`;
      },
    ),
    antiRobot: {
      isHuman: async (token) => {
        checkedTokens.push(token);
        return isHuman;
      },
    },
    rateLimit: { isAllowed: async () => isAllowed },
  })(request, VISITOR);

beforeEach(() => {
  state = createInMemorySalesState();
  isHuman = true;
  isAllowed = true;
  checkedTokens = [];
  counter = 0;
});

describe("requestWebsiteCallback", () => {
  it("creates an unknown company with the department of its postal code", async () => {
    await run();
    expect(state.companies).toEqual([
      expect.objectContaining({
        name: "Ramonage Paul",
        phone: "06 12 34 56 78",
        postalCode: "94100",
        department: "94",
        ownerUserId: null,
      }),
    ]);
  });

  it("names the company after the first name when no company is given", async () => {
    await run({ ...REQUEST, company: null });
    expect(state.companies.map(({ name }) => name)).toEqual(["Paul"]);
  });

  it("schedules a website callback tomorrow at the start of the slot, Paris time", async () => {
    const result = await run({ ...REQUEST, slot: "afternoon" });
    expect(result).toEqual({ isOk: true, value: { taskId: state.websiteTaskIds[0] } });
    expect(state.tasks).toEqual([
      expect.objectContaining({
        kind: "callback",
        status: "open",
        companyId: state.companies[0]?.id,
        dueAt: new Date("2026-10-25T13:00:00Z"),
        notify: "at_time",
        notifyAt: new Date("2026-10-25T13:00:00Z"),
      }),
    ]);
  });

  it("gives the callback to the owner of a known company found by its phone", async () => {
    state.companies.push(
      inMemoryCompany({
        id: "company-known",
        name: "Ramonage Paul",
        phone: "06 12 34 56 78",
        ownerUserId: "user-antho",
      }),
    );
    await run();
    expect(state.companies).toHaveLength(1);
    expect(state.tasks).toEqual([
      expect.objectContaining({ companyId: "company-known", ownerUserId: "user-antho" }),
    ]);
  });

  it("finds a known company through the mobile of one of its contacts", async () => {
    state.companies.push(inMemoryCompany({ id: "company-known", name: "Les Ramoneurs" }));
    state.contacts.push(
      inMemoryContact({
        id: "contact-1",
        companyId: "company-known",
        lastName: "Martin",
        mobile: "06 12 34 56 78",
      }),
    );
    await run();
    expect(state.companies).toHaveLength(1);
    expect(state.tasks.map(({ companyId }) => companyId)).toEqual(["company-known"]);
  });

  it("writes everything the visitor sent in a note on the company", async () => {
    await run({ ...REQUEST, pagePath: "/ramoneur", message: "Plutôt après 10 h" });
    expect(state.events).toEqual([
      expect.objectContaining({
        kind: "note",
        authorUserId: null,
        companyId: state.companies[0]?.id,
        body: [
          "Demande de rappel depuis le site (page /ramoneur).",
          "Prénom : Paul.",
          "Entreprise : Ramonage Paul.",
          "Téléphone : 06 12 34 56 78. Code postal : 94100.",
          "À rappeler le matin, entre 8 h et 12 h.",
          "Message : Plutôt après 10 h",
        ].join("\n"),
      }),
    ]);
  });

  it("checks the anti-robot token sent by the visitor", async () => {
    await run();
    expect(checkedTokens).toEqual(["token"]);
  });

  it("refuses a suspected robot without writing anything", async () => {
    isHuman = false;
    expect(await run()).toEqual({ isOk: false, error: "robot_suspected" });
    expect([state.companies, state.tasks, state.events]).toEqual([[], [], []]);
  });

  it("refuses a visitor over the limit before checking the token", async () => {
    isAllowed = false;
    expect(await run()).toEqual({ isOk: false, error: "too_many_requests" });
    expect([checkedTokens, state.companies, state.tasks, state.events]).toEqual([[], [], [], []]);
  });
});
