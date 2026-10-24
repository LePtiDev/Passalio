import { schema } from "@passalio/db";
import { getTableName, is } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyAllMigrations,
  applyEachInOrder,
  applyMigrationFile,
  migrationFileNames,
  readJournal,
  startEmptyD1,
  type EmptyD1,
} from "./empty-d1";
import { userTablesOf } from "./schema-shape";

const schemaTableNames = Object.values(schema)
  .filter((value) => is(value, SQLiteTable))
  .map((table) => getTableName(table))
  .toSorted((left, right) => left.localeCompare(right));

describe("D1 migrations", () => {
  let d1: EmptyD1;

  beforeEach(async () => {
    d1 = await startEmptyD1();
  });

  afterEach(async () => {
    await d1.dispose();
  });

  it("the migration journal lists every migration file, in order", async () => {
    const journal = await readJournal();

    expect(journal.entries.map(({ tag }) => `${tag}.sql`)).toEqual(await migrationFileNames());
    expect(journal.entries.map(({ idx }) => idx)).toEqual(journal.entries.map((_, index) => index));
  });

  it("starts from a database with no table", async () => {
    expect(await userTablesOf(d1.database)).toEqual([]);
  });

  it("applies every migration one after the other on an empty D1 database", async () => {
    const applied: string[] = [];
    await applyEachInOrder(await migrationFileNames(), async (fileName) => {
      await applyMigrationFile(d1.database, fileName);
      applied.push(fileName);
    });

    expect(applied).toEqual(await migrationFileNames());
    expect(applied.length).toBeGreaterThan(0);
  });

  it("creates every table of the Drizzle schema and no other", async () => {
    await applyAllMigrations(d1.database);

    expect(await userTablesOf(d1.database)).toEqual(schemaTableNames);
  });

  it("leaves a database that passes the SQLite integrity and foreign key checks", async () => {
    await applyAllMigrations(d1.database);

    const integrity = await d1.database.prepare("pragma quick_check").all();
    const foreignKeyViolations = await d1.database.prepare("pragma foreign_key_check").all();

    expect(integrity.results).toEqual([{ quick_check: "ok" }]);
    expect(foreignKeyViolations.results).toEqual([]);
  });
});
