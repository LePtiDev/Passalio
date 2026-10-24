import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { schema } from "@passalio/db";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  applyAllMigrations,
  applyStatements,
  MIGRATIONS_DIRECTORY,
  readJournal,
  startEmptyD1,
  type EmptyD1,
} from "./empty-d1";
import { schemaShapeOf, type TableShape } from "./schema-shape";

const snapshotSchema = z.object({
  dialect: z.literal("sqlite"),
  tables: z.record(z.string(), z.unknown()),
});

const latestSnapshot = async () => {
  const latest = (await readJournal()).entries.at(-1);
  const index = String(latest?.idx ?? 0).padStart(4, "0");
  const content = await readFile(join(MIGRATIONS_DIRECTORY, `meta/${index}_snapshot.json`), "utf8");
  return snapshotSchema.parse(JSON.parse(content));
};

const schemaStatements = async () =>
  generateSQLiteMigration(
    await generateSQLiteDrizzleJson({}),
    await generateSQLiteDrizzleJson(schema),
  );

describe("Drizzle schema and migrations", () => {
  let migrated: EmptyD1;
  let fromSchema: EmptyD1;
  let migratedShape: readonly TableShape[];
  let schemaShape: readonly TableShape[];

  beforeAll(async () => {
    migrated = await startEmptyD1();
    fromSchema = await startEmptyD1();
    await applyAllMigrations(migrated.database);
    await applyStatements(fromSchema.database, await schemaStatements());
    migratedShape = await schemaShapeOf(migrated.database);
    schemaShape = await schemaShapeOf(fromSchema.database);
  });

  afterAll(async () => {
    await migrated.dispose();
    await fromSchema.dispose();
  });

  it("the latest migration snapshot holds exactly the tables of the Drizzle schema", async () => {
    const current = await generateSQLiteDrizzleJson(schema);

    expect((await latestSnapshot()).tables).toEqual(current.tables);
  });

  it("the migrated database has the same tables as the Drizzle schema", () => {
    expect(schemaShape.length).toBeGreaterThan(0);
    expect(migratedShape.map(({ table }) => table)).toEqual(schemaShape.map(({ table }) => table));
  });

  it("every table has the same columns, types, defaults and keys in the migrations and the Drizzle schema", () => {
    expect(migratedShape.map(({ table, columns }) => ({ table, columns }))).toEqual(
      schemaShape.map(({ table, columns }) => ({ table, columns })),
    );
  });

  it("every table has the same indexes in the migrations and the Drizzle schema", () => {
    expect(migratedShape.map(({ table, indexes }) => ({ table, indexes }))).toEqual(
      schemaShape.map(({ table, indexes }) => ({ table, indexes })),
    );
  });

  it("every table has the same foreign keys in the migrations and the Drizzle schema", () => {
    expect(migratedShape.map(({ table, foreignKeys }) => ({ table, foreignKeys }))).toEqual(
      schemaShape.map(({ table, foreignKeys }) => ({ table, foreignKeys })),
    );
  });
});
