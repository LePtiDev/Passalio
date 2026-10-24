import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "../../src/platform/database";
import { ACCEPTED_WHOLE_READS, acceptedStepsOf } from "./accepted-whole-reads";
import { applyAllMigrations, startEmptyD1, type EmptyD1 } from "./empty-d1";
import { QUERY_CATALOG } from "./query-catalog";
import {
  explain,
  fullScansOfGrowingTables,
  isReadOrWrite,
  organizationFilteredTables,
  stepsNotUsingOrganizationIndex,
  wholeIndexReadsOfGrowingTables,
  type ExplainedStatement,
} from "./query-plan";
import { RecordingD1 } from "./recording-d1";
import { createRepositories, repositoryMethodsOf, type Repositories } from "./repositories";
import { seedDatabase, type Seeded } from "./seed";

const SOURCE_DIRECTORY = join(import.meta.dirname, "../../src");

const FILES_QUERYING_D1 = [
  "contexts/backoffice/infrastructure/activity-queries.ts",
  "contexts/backoffice/infrastructure/d1-account-read-model.ts",
  "contexts/backoffice/infrastructure/d1-journal-read-model.ts",
  "contexts/compliance/infrastructure/d1-document-repository.ts",
  "contexts/compliance/infrastructure/d1-number-block-repository.ts",
  "contexts/compliance/infrastructure/d1-signing-targets.ts",
  "contexts/customers/infrastructure/d1-change-feed.ts",
  "contexts/customers/infrastructure/d1-customer-repository.ts",
  "contexts/customers/infrastructure/d1-equipment-repository.ts",
  "contexts/customers/infrastructure/d1-organization-trades.ts",
  "contexts/customers/infrastructure/d1-photo-repository.ts",
  "contexts/customers/infrastructure/d1-plate-reading-repository.ts",
  "contexts/customers/infrastructure/d1-site-repository.ts",
  "contexts/identity/infrastructure/d1-invitation-repository.ts",
  "contexts/identity/infrastructure/d1-member-repository.ts",
  "contexts/identity/infrastructure/d1-organization-repository.ts",
  "contexts/mcp/infrastructure/mcp-caller-repository.ts",
  "contexts/mcp/infrastructure/mcp-rate-limit.ts",
  "contexts/platform-settings/infrastructure/d1-pending-invitation-lookup.ts",
  "contexts/platform-settings/infrastructure/d1-platform-settings-repository.ts",
  "contexts/platform-team/infrastructure/d1-team-invitation-repository.ts",
  "contexts/platform-team/infrastructure/d1-teammate-repository.ts",
  "contexts/sales/infrastructure/d1-call-repository.ts",
  "contexts/sales/infrastructure/d1-company-repository.ts",
  "contexts/sales/infrastructure/d1-contact-repository.ts",
  "contexts/sales/infrastructure/d1-event-repository.ts",
  "contexts/sales/infrastructure/d1-follow-up-repository.ts",
  "contexts/sales/infrastructure/d1-mail-member-directory.ts",
  "contexts/sales/infrastructure/d1-mail-settings-repository.ts",
  "contexts/sales/infrastructure/d1-reminder-repository.ts",
  "contexts/sales/infrastructure/d1-task-repository.ts",
  "contexts/sales/infrastructure/main-contacts.ts",
  "contexts/sales/infrastructure/sales-dependencies.ts",
  "contexts/scheduling/infrastructure/d1-intervention-places.ts",
  "contexts/scheduling/infrastructure/d1-intervention-repository.ts",
  "contexts/scheduling/infrastructure/d1-service-repository.ts",
  "platform/activity-log.ts",
  "platform/audit-trail.ts",
  "platform/auth.ts",
  "platform/database.ts",
];

const filesQueryingD1 = async () => {
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
    .filter(({ content }) => /from "(@passalio\/db|drizzle-orm[^"]*)"/.test(content))
    .map(({ file }) => file)
    .toSorted((left, right) => left.localeCompare(right));
};

describe("query plans of the D1 repositories", () => {
  let d1: EmptyD1;
  let recorder: RecordingD1;
  let repositories: Repositories;
  let seeded: Seeded;

  const explainedStatementsOf = async (query: (typeof QUERY_CATALOG)[number]) => {
    const recorded = await recorder.recording(() => query.run(repositories, seeded));
    return Promise.all(
      recorded.filter(isReadOrWrite).map((statement) => explain(d1.database, statement)),
    );
  };

  beforeAll(async () => {
    d1 = await startEmptyD1();
    await applyAllMigrations(d1.database);
    recorder = new RecordingD1(d1.database);
    repositories = createRepositories(createDatabase(recorder));
    seeded = await seedDatabase(createDatabase(d1.database), repositories);
  });

  afterAll(async () => {
    await d1.dispose();
  });

  it("every repository method has at least one query in the catalog", () => {
    const cataloged = new Set(QUERY_CATALOG.map(({ method }) => method));

    expect(repositoryMethodsOf(repositories).filter((method) => !cataloged.has(method))).toEqual(
      [],
    );
  });

  it("every source file that queries D1 is known to this catalog", async () => {
    expect(await filesQueryingD1()).toEqual(FILES_QUERYING_D1);
  });

  it("every query of the catalog names an existing repository method and is unique", () => {
    const methods = new Set(repositoryMethodsOf(repositories));
    const names = QUERY_CATALOG.map(({ method, query }) => `${method}: ${query}`);

    expect(QUERY_CATALOG.filter(({ method }) => !methods.has(method))).toEqual([]);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every accepted whole read names a cataloged query", () => {
    const cataloged = new Set(QUERY_CATALOG.map(({ method, query }) => `${method}: ${query}`));

    expect(ACCEPTED_WHOLE_READS.filter(({ query }) => !cataloged.has(query))).toEqual([]);
  });

  describe.each(QUERY_CATALOG.map((query) => [`${query.method}: ${query.query}`, query] as const))(
    "%s",
    (name, query) => {
      let explained: readonly ExplainedStatement[];
      const accepted = new Set(acceptedStepsOf(name));
      const isNotAccepted = (step: string) => !accepted.has(step);

      beforeAll(async () => {
        explained = await explainedStatementsOf(query);
      });

      it("runs at least one SQL statement against the migrated database", () => {
        expect(explained.length).toBeGreaterThan(0);
      });

      it("never scans a whole table that grows", () => {
        const scans = explained.map((statement) => ({
          sql: statement.sql,
          plan: statement.plan,
          fullScans: fullScansOfGrowingTables(statement).filter(isNotAccepted),
        }));

        expect(scans.filter(({ fullScans }) => fullScans.length > 0)).toEqual([]);
      });

      it("reaches organization data through an index that starts with organization_id", async () => {
        const checked = await Promise.all(
          explained.map(async (statement) => ({
            sql: statement.sql,
            organizationTables: organizationFilteredTables(statement),
            plan: statement.plan,
            violations: await stepsNotUsingOrganizationIndex(d1.database, statement),
          })),
        );

        expect(checked.filter(({ violations }) => violations.length > 0)).toEqual([]);
      });

      it("reads a whole index of a table that grows only to walk one page in index order", () => {
        const reads = explained.map((statement) => ({
          sql: statement.sql,
          plan: statement.plan,
          wholeIndexReads: wholeIndexReadsOfGrowingTables(statement).filter(isNotAccepted),
        }));

        expect(reads.filter(({ wholeIndexReads }) => wholeIndexReads.length > 0)).toEqual([]);
      });

      it("still makes every whole read accepted for it", () => {
        const plans = new Set(explained.flatMap(({ plan }) => plan));

        expect([...accepted].filter((step) => !plans.has(step))).toEqual([]);
      });
    },
  );
});
