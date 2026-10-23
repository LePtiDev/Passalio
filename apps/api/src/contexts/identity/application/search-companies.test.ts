import { err } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { CompanyDirectory } from "../domain/identity-ports";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { COMPANY_SEARCH_MIN_LENGTH, searchCompanies } from "./search-companies";

const DUPONT = {
  name: "Ramonage Dupont",
  siret: "12345678900011",
  address: "1 rue du Four",
  postalCode: "75011",
  city: "Paris",
};

let state: InMemoryIdentityState;
let queries: string[];
const recordingDirectory = (directory: CompanyDirectory): CompanyDirectory => ({
  search: async (query) => {
    queries.push(query);
    return directory.search(query);
  },
});
const run = () =>
  searchCompanies({
    companyDirectory: recordingDirectory(
      createInMemoryIdentityDependencies(state).companyDirectory,
    ),
  });

beforeEach(() => {
  state = createInMemoryIdentityState();
  state.companies.push(DUPONT);
  queries = [];
});

describe("searchCompanies", () => {
  it("searches the directory with the trimmed text only", async () => {
    expect(await run()("  dupont ")).toEqual({ isOk: true, value: [DUPONT] });
    expect(queries).toEqual(["dupont"]);
  });

  it("does not call the directory under 3 characters", async () => {
    expect(COMPANY_SEARCH_MIN_LENGTH).toBe(3);
    expect(await run()(" du ")).toEqual({ isOk: true, value: [] });
    expect(queries).toEqual([]);
  });

  it("searches from exactly 3 characters", async () => {
    await run()("dup");
    expect(queries).toEqual(["dup"]);
  });

  it("tells when the directory is unavailable", async () => {
    const unavailable = searchCompanies({
      companyDirectory: { search: async () => err("company_search_unavailable") },
    });
    expect(await unavailable("dupont")).toEqual({
      isOk: false,
      error: "company_search_unavailable",
    });
  });
});
