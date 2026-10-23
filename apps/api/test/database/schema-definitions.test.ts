import { schema } from "@passalio/db";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyAllMigrations, applyStatements, startEmptyD1, type EmptyD1 } from "./empty-d1";
import { definitionsOf } from "./schema-definitions";

describe("index, trigger and view definitions of the migrations and the Drizzle schema", () => {
  let migrated: EmptyD1;
  let fromSchema: EmptyD1;

  beforeAll(async () => {
    migrated = await startEmptyD1();
    fromSchema = await startEmptyD1();
    await applyAllMigrations(migrated.database);
    await applyStatements(
      fromSchema.database,
      await generateSQLiteMigration(
        await generateSQLiteDrizzleJson({}),
        await generateSQLiteDrizzleJson(schema),
      ),
    );
  });

  afterAll(async () => {
    await migrated.dispose();
    await fromSchema.dispose();
  });

  it("every index has the same definition, with its order, collation and condition", async () => {
    const migratedIndexes = await definitionsOf(migrated.database, ["index"]);

    expect(migratedIndexes.length).toBeGreaterThan(0);
    expect(migratedIndexes).toEqual(await definitionsOf(fromSchema.database, ["index"]));
  });

  it("the migrations create no trigger or view that the Drizzle schema does not declare", async () => {
    expect(await definitionsOf(migrated.database, ["trigger", "view"])).toEqual(
      await definitionsOf(fromSchema.database, ["trigger", "view"]),
    );
  });

  it("tells apart two indexes that differ only by order or by condition", async () => {
    const scratch = await startEmptyD1();
    await applyStatements(scratch.database, [
      'create table "notes" ("id" text primary key, "rank" integer, "deleted_at" integer)',
      'create index "notes_rank_idx" on "notes" ("rank")',
    ]);
    const plain = await definitionsOf(scratch.database, ["index"]);
    await applyStatements(scratch.database, [
      'drop index "notes_rank_idx"',
      'create index "notes_rank_idx" on "notes" ("rank" desc)',
    ]);
    const descending = await definitionsOf(scratch.database, ["index"]);
    await applyStatements(scratch.database, [
      'drop index "notes_rank_idx"',
      'create index "notes_rank_idx" on "notes" ("rank") where "deleted_at" is null',
    ]);
    const partial = await definitionsOf(scratch.database, ["index"]);
    await scratch.dispose();

    expect(plain).toHaveLength(1);
    expect(descending).not.toEqual(plain);
    expect(partial).not.toEqual(plain);
  });
});
