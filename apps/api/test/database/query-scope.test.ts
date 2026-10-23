import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/platform/database";
import { CROSS_ORGANIZATION_QUERIES, isCrossOrganizationQuery } from "./cross-organization-queries";
import { applyAllMigrations, startEmptyD1, type EmptyD1 } from "./empty-d1";
import {
  automaticIndexesOnGrowingTables,
  organizationTablesOf,
  tablesReadWithoutOrganizationFilter,
} from "./organization-scope";
import { QUERY_CATALOG } from "./query-catalog";
import { explain, isReadOrWrite, type ExplainedStatement } from "./query-plan";
import { RecordingD1 } from "./recording-d1";
import { createRepositories, type Repositories } from "./repositories";
import { seedDatabase, type Seeded } from "./seed";

const SOURCE_DIRECTORY = join(import.meta.dirname, "../../src");

const nameOf = (query: (typeof QUERY_CATALOG)[number]) => `${query.method}: ${query.query}`;

const sourcesSendingRawSqlToD1 = async () => {
  const files = await readdir(SOURCE_DIRECTORY, { recursive: true });
  const sources = await Promise.all(
    files
      .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
      .map(async (file) => ({
        file: relative(SOURCE_DIRECTORY, join(SOURCE_DIRECTORY, file)),
        content: await readFile(join(SOURCE_DIRECTORY, file), "utf8"),
      })),
  );
  return sources
    .filter(({ content }) => /\.(prepare|exec|withSession|dump)\(|\bDB\.batch\(/.test(content))
    .map(({ file }) => file);
};

describe("organization scope of the D1 repository queries", () => {
  let d1: EmptyD1;
  let recorder: RecordingD1;
  let repositories: Repositories;
  let seeded: Seeded;
  let organizationTables: ReadonlySet<string>;

  const explainedByQuery = new Map<string, Promise<readonly ExplainedStatement[]>>();

  const runAndExplain = async (query: (typeof QUERY_CATALOG)[number]) => {
    const recorded = await recorder.recording(() => query.run(repositories, seeded));
    return Promise.all(
      recorded.filter(isReadOrWrite).map((statement) => explain(d1.database, statement)),
    );
  };

  const explainedStatementsOf = (query: (typeof QUERY_CATALOG)[number]) => {
    const known = explainedByQuery.get(nameOf(query));
    if (known !== undefined) {
      return known;
    }
    const explained = runAndExplain(query);
    explainedByQuery.set(nameOf(query), explained);
    return explained;
  };

  const unfilteredStatementsOf = async (query: (typeof QUERY_CATALOG)[number]) =>
    (await explainedStatementsOf(query))
      .map((statement) => ({
        sql: statement.sql,
        tables: tablesReadWithoutOrganizationFilter(statement, organizationTables),
      }))
      .filter(({ tables }) => tables.length > 0);

  beforeAll(async () => {
    d1 = await startEmptyD1();
    await applyAllMigrations(d1.database);
    recorder = new RecordingD1(d1.database);
    repositories = createRepositories(createDatabase(recorder));
    seeded = await seedDatabase(createDatabase(d1.database), repositories);
    organizationTables = await organizationTablesOf(d1.database);
  });

  afterAll(async () => {
    await d1.dispose();
  });

  it("knows the tables that hold organization data", () => {
    expect([...organizationTables].toSorted((left, right) => left.localeCompare(right))).toEqual(
      expect.arrayContaining([
        "customers",
        "sites",
        "equipments",
        "equipment_photos",
        "members",
        "invitations",
        "audit_logs",
      ]),
    );
  });

  it("every cross-organization exemption names a cataloged query", () => {
    const cataloged = new Set(QUERY_CATALOG.map(nameOf));

    expect(Object.keys(CROSS_ORGANIZATION_QUERIES).filter((name) => !cataloged.has(name))).toEqual(
      [],
    );
  });

  it("no source file sends SQL to D1 without going through the Drizzle database", async () => {
    expect(await sourcesSendingRawSqlToD1()).toEqual([]);
  });

  describe.each(QUERY_CATALOG.map((query) => [nameOf(query), query] as const))("%s", (_, query) => {
    it("never builds a temporary index on a table that grows", async () => {
      const built = (await explainedStatementsOf(query)).map((statement) => ({
        sql: statement.sql,
        plan: statement.plan,
        automaticIndexes: automaticIndexesOnGrowingTables(statement),
      }));

      expect(built.filter(({ automaticIndexes }) => automaticIndexes.length > 0)).toEqual([]);
    });
  });

  describe.each(
    QUERY_CATALOG.filter((query) => !isCrossOrganizationQuery(nameOf(query))).map(
      (query) => [nameOf(query), query] as const,
    ),
  )("%s", (_, query) => {
    it("filters every table of organization data by organization_id", async () => {
      expect(await unfilteredStatementsOf(query)).toEqual([]);
    });
  });

  describe.each(
    QUERY_CATALOG.filter((query) => isCrossOrganizationQuery(nameOf(query))).map(
      (query) => [nameOf(query), query] as const,
    ),
  )("%s", (_, query) => {
    it("is listed as cross-organization because it really reads several organizations", async () => {
      expect(await unfilteredStatementsOf(query)).not.toEqual([]);
    });
  });
});
