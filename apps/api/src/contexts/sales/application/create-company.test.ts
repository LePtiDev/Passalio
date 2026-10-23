import { PLATFORM_ROLES, prospectCompanyResponse } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  createInMemorySalesDependencies,
  createInMemorySalesState,
  type InMemorySalesState,
} from "../infrastructure/in-memory-sales-dependencies";
import { createCompany } from "./create-company";

const NOW = new Date("2026-10-23T10:00:00Z");

let state: InMemorySalesState;
const run = () =>
  createCompany(
    createInMemorySalesDependencies(
      state,
      () => NOW,
      () => "company-1",
    ),
  );

beforeEach(() => {
  state = createInMemorySalesState();
});

describe("createCompany", () => {
  it.each(PLATFORM_ROLES)("lets a %s create a prospect company", async (role) => {
    await run()(platformActorWith(role), { name: "Gaz Hop", department: "94" });
    expect(state.companies.map(({ id }) => id)).toEqual(["company-1"]);
  });

  it("starts the company at the to-qualify stage, without owner, searchable by name, city, postal code and SIREN", async () => {
    const response = await run()(platformActorWith("sales"), {
      name: "Cheminées de l'Île",
      siren: "123456789",
      postalCode: "94000",
      city: "Créteil",
      department: "94",
      phone: "0102030405",
      currentTool: "Excel",
    });
    expect(state.companies[0]).toMatchObject({
      id: "company-1",
      name: "Cheminées de l'Île",
      searchName: "cheminees de l ile",
      searchText: "cheminees de l ile creteil 94000 123456789",
      stage: "to_qualify",
      ownerUserId: null,
      sourceRef: null,
      foundedOn: null,
      registryStatus: null,
      currentTool: "Excel",
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(prospectCompanyResponse.parse(response)).toEqual(response);
    expect(response).toMatchObject({
      id: "company-1",
      name: "Cheminées de l'Île",
      stage: "to_qualify",
      owner: null,
      createdAt: "2026-10-23T10:00:00.000Z",
      updatedAt: "2026-10-23T10:00:00.000Z",
    });
  });

  it("stores missing optional fields as empty", async () => {
    await run()(platformActorWith("admin"), { name: "Gaz Hop", department: "94" });
    expect(state.companies[0]).toMatchObject({
      legalName: null,
      siren: null,
      nafCode: null,
      legalForm: null,
      address: null,
      postalCode: null,
      city: null,
      latitude: null,
      longitude: null,
      phone: null,
      email: null,
      website: null,
      activity: null,
      headcount: null,
      currentTool: null,
      notes: null,
    });
  });

  it("never sends internal search columns to the browser", async () => {
    const response = await run()(platformActorWith("admin"), { name: "Gaz Hop", department: "94" });
    expect(response).not.toHaveProperty("searchName");
    expect(response).not.toHaveProperty("searchText");
    expect(response).not.toHaveProperty("sourceRef");
    expect(response).not.toHaveProperty("ownerUserId");
  });
});
