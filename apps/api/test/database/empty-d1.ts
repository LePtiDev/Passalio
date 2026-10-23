import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPlatformProxy } from "wrangler";
import { z } from "zod";
import type { Bindings } from "../../src/env";

export const MIGRATIONS_DIRECTORY = join(import.meta.dirname, "../../../../packages/db/migrations");

const JOURNAL_PATH = join(MIGRATIONS_DIRECTORY, "meta/_journal.json");
const STATEMENT_BREAKPOINT = "--> statement-breakpoint";

const journalSchema = z.object({
  dialect: z.literal("sqlite"),
  entries: z.array(z.object({ idx: z.number(), tag: z.string() })),
});

export type Journal = z.infer<typeof journalSchema>;

export type EmptyD1 = {
  readonly database: D1Database;
  readonly dispose: () => Promise<void>;
};

export const startEmptyD1 = async (): Promise<EmptyD1> => {
  const proxy = await getPlatformProxy<Bindings>({ persist: false });
  return { database: proxy.env.DB, dispose: () => proxy.dispose() };
};

export const readJournal = async (): Promise<Journal> =>
  journalSchema.parse(JSON.parse(await readFile(JOURNAL_PATH, "utf8")));

export const migrationFileNames = async (): Promise<readonly string[]> =>
  (await readdir(MIGRATIONS_DIRECTORY))
    .filter((file) => file.endsWith(".sql"))
    .toSorted((left, right) => left.localeCompare(right));

export const statementsOf = (sql: string): readonly string[] =>
  sql
    .split(STATEMENT_BREAKPOINT)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

export const readMigration = async (fileName: string): Promise<string> =>
  readFile(join(MIGRATIONS_DIRECTORY, fileName), "utf8");

export const applyStatements = async (database: D1Database, statements: readonly string[]) => {
  await database.batch(statements.map((statement) => database.prepare(statement)));
};

export const applyMigrationFile = async (database: D1Database, fileName: string) =>
  applyStatements(database, statementsOf(await readMigration(fileName)));

export const applyEachInOrder = async <Item>(
  items: readonly Item[],
  apply: (item: Item) => Promise<void>,
) =>
  items.reduce<Promise<void>>(async (previous, item) => {
    await previous;
    await apply(item);
  }, Promise.resolve());

export const applyAllMigrations = async (database: D1Database) =>
  applyEachInOrder(await migrationFileNames(), (fileName) =>
    applyMigrationFile(database, fileName),
  );
