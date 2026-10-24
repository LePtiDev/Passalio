import { PLATFORM_ROLES, prospectCallSeriesResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  inMemoryCompany,
  inMemoryContact,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import type { ProspectFollowUp } from "../domain/call-models";
import { listCallSeries } from "./list-call-series";

const NOW = new Date("2026-10-24T08:00:00Z");
const CALLED_AT = new Date("2026-10-20T08:00:00Z");

let state: InMemorySalesState;
const run = () =>
  listCallSeries(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "new-id",
    ),
  );
const sales = platformActorWith("sales");

const calledWith = (
  companyId: string,
  outcome: NonNullable<ProspectFollowUp["lastCallOutcome"]>,
): ProspectFollowUp => ({
  companyId,
  lastCallAt: CALLED_AT,
  lastCallOutcome: outcome,
  lastCallByUserId: null,
  interest: "warm",
  teamSize: null,
  toolKind: null,
  certificateVolume: null,
  decisionMaker: null,
  updatedAt: CALLED_AT,
});

beforeEach(() => {
  state = createInMemorySalesState();
  state.companies.push(
    inMemoryCompany({ id: "company-a", name: "Alpha Ramonage", phone: "0101", department: "94" }),
    inMemoryCompany({
      id: "company-b",
      name: "Beta Ramonage",
      phone: "0102",
      department: "94",
      stage: "qualified",
    }),
    inMemoryCompany({
      id: "company-c",
      name: "Gamma Ramonage",
      phone: "0103",
      department: "75",
      stage: "interested",
    }),
    inMemoryCompany({ id: "company-no-phone", name: "Delta Ramonage", department: "94" }),
    inMemoryCompany({
      id: "company-customer",
      name: "Epsilon",
      phone: "0105",
      department: "94",
      stage: "customer",
    }),
    inMemoryCompany({
      id: "company-closed",
      name: "Zeta",
      phone: "0106",
      department: "94",
      stage: "not_interested",
    }),
    inMemoryCompany({
      id: "company-demo",
      name: "Eta",
      phone: "0107",
      department: "94",
      stage: "demo_planned",
    }),
    inMemoryCompany({
      id: "company-voicemail",
      name: "Iota Ramonage",
      phone: "0108",
      department: "94",
    }),
    inMemoryCompany({
      id: "company-answered",
      name: "Kappa Ramonage",
      phone: "0109",
      department: "94",
    }),
  );
  state.contacts.push(
    inMemoryContact({
      id: "contact-a",
      companyId: "company-a",
      firstName: "Paul",
      lastName: "Dupuis",
      isMain: true,
    }),
  );
  state.followUps.push(
    calledWith("company-b", "no_answer"),
    calledWith("company-voicemail", "voicemail"),
    calledWith("company-answered", "answered"),
  );
});

describe("listCallSeries", () => {
  it.each(PLATFORM_ROLES)("builds a call series for a %s", async (role) => {
    expect(
      prospectCallSeriesResponse.parse(
        await run()(platformActorWith(role), { target: "never_called" }),
      ),
    ).toMatchObject({ nextCursor: null });
  });

  it("calls the companies never called, with a phone, still open, by name", async () => {
    const series = await run()(sales, { target: "never_called" });
    expect(series.companies).toEqual([
      {
        id: "company-a",
        name: "Alpha Ramonage",
        city: null,
        department: "94",
        phone: "0101",
        stage: "to_qualify",
        mainContact: { id: "contact-a", name: "Paul Dupuis" },
        lastCallAt: null,
        lastCallOutcome: null,
        interest: null,
      },
      expect.objectContaining({ id: "company-c" }),
    ]);
  });

  it("calls back the companies that did not answer or went to voicemail", async () => {
    const series = await run()(sales, { target: "not_reached" });
    expect(series.companies).toEqual([
      {
        id: "company-b",
        name: "Beta Ramonage",
        city: null,
        department: "94",
        phone: "0102",
        stage: "qualified",
        mainContact: null,
        lastCallAt: CALLED_AT.toISOString(),
        lastCallOutcome: "no_answer",
        interest: "warm",
      },
      expect.objectContaining({ id: "company-voicemail", lastCallOutcome: "voicemail" }),
    ]);
  });

  it("keeps one department", async () => {
    const series = await run()(sales, { target: "never_called", department: "75" });
    expect(series.companies.map(({ id }) => id)).toEqual(["company-c"]);
  });

  it("pages the series with a cursor", async () => {
    const first = await run()(sales, { target: "not_reached", limit: 1 });
    expect(first.companies.map(({ id }) => id)).toEqual(["company-b"]);
    expect(first.nextCursor).not.toBeNull();
    const second = await run()(sales, {
      target: "not_reached",
      limit: 1,
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.companies.map(({ id }) => id)).toEqual(["company-voicemail"]);
    expect(second.nextCursor).toBeNull();
  });
});
