import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  applyEachInOrder,
  applyMigrationFile,
  MIGRATIONS_DIRECTORY,
  migrationFileNames,
  readJournal,
  startEmptyD1,
} from "./empty-d1";
import { insertOneRowPerTable, rowCountsOf } from "./table-rows";

const FIRST_SNAPSHOT_PARENT = "00000000-0000-0000-0000-000000000000";

const snapshotLinkSchema = z.object({ id: z.string(), prevId: z.string() });

const snapshotOf = async (idx: number) =>
  snapshotLinkSchema.parse(
    JSON.parse(
      await readFile(
        join(MIGRATIONS_DIRECTORY, `meta/${String(idx).padStart(4, "0")}_snapshot.json`),
        "utf8",
      ),
    ),
  );

describe("migration history", () => {
  it("every journal entry has a snapshot chained to the snapshot before it", async () => {
    const snapshots = await Promise.all(
      (await readJournal()).entries.map(({ idx }) => snapshotOf(idx)),
    );

    expect(snapshots.map(({ prevId }) => prevId)).toEqual([
      FIRST_SNAPSHOT_PARENT,
      ...snapshots.slice(0, -1).map(({ id }) => id),
    ]);
  });

  it("every migration file starts with the number of its journal entry", async () => {
    const journal = await readJournal();

    expect(
      journal.entries.map(({ idx, tag }) => tag.startsWith(`${String(idx).padStart(4, "0")}_`)),
    ).toEqual(journal.entries.map(() => true));
  });

  it("applies every migration on a database that already holds rows, and keeps every row", async () => {
    const d1 = await startEmptyD1();
    const files = await migrationFileNames();
    const written = new Map<string, number>();
    const failures: { file: string; error: string }[] = [];

    await applyEachInOrder(
      files.map((file, round) => ({ file, round })),
      async ({ file, round }) => {
        const tables = round === 0 ? [] : await insertOneRowPerTable(d1.database, round);
        tables.forEach((table) => written.set(table, (written.get(table) ?? 0) + 1));
        await applyMigrationFile(d1.database, file).catch((error: unknown) => {
          failures.push({ file, error: String(error) });
        });
      },
    );
    const counts = await rowCountsOf(d1.database);
    const foreignKeyViolations = await d1.database.prepare("pragma foreign_key_check").all();
    await d1.dispose();

    expect(failures).toEqual([]);
    expect(written.size).toBeGreaterThan(0);
    expect([...written].map(([table]) => ({ table, rows: counts.get(table) ?? 0 }))).toEqual(
      [...written].map(([table, rows]) => ({ table, rows })),
    );
    expect(foreignKeyViolations.results).toEqual([]);
  }, 60_000);
});
