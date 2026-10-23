import { z } from "zod";

const INTERNAL_TABLE_PREFIXES = ["sqlite_", "_cf_", "d1_"];

const tableRowSchema = z.object({ name: z.string() });

const columnRowSchema = z.object({
  name: z.string(),
  type: z.string(),
  notnull: z.number(),
  dflt_value: z.string().nullable(),
  pk: z.number(),
  hidden: z.number(),
});

const indexRowSchema = z.object({
  name: z.string(),
  unique: z.number(),
  origin: z.string(),
  partial: z.number(),
});

const indexColumnRowSchema = z.object({ seqno: z.number(), name: z.string().nullable() });

const foreignKeyRowSchema = z.object({
  id: z.number(),
  seq: z.number(),
  table: z.string(),
  from: z.string(),
  to: z.string().nullable(),
  on_update: z.string(),
  on_delete: z.string(),
});

const rowsOf = async <Row>(database: D1Database, sql: string, schema: z.ZodType<Row>) =>
  z.array(schema).parse((await database.prepare(sql).all()).results);

const quoted = (name: string) => `'${name.replaceAll("'", "''")}'`;

const byName = <Item extends { readonly name: string | null }>(left: Item, right: Item) =>
  (left.name ?? "").localeCompare(right.name ?? "");

export const indexColumnsOf = async (database: D1Database, indexName: string) =>
  (await rowsOf(database, `pragma index_info(${quoted(indexName)})`, indexColumnRowSchema))
    .toSorted((left, right) => left.seqno - right.seqno)
    .map(({ name }) => name);

export const isUniqueIndex = async (database: D1Database, table: string, indexName: string) =>
  (await rowsOf(database, `pragma index_list(${quoted(table)})`, indexRowSchema)).some(
    ({ name, unique }) => name === indexName && unique === 1,
  );

export const userTablesOf = async (database: D1Database): Promise<readonly string[]> =>
  (
    await rowsOf(
      database,
      "select name from sqlite_master where type = 'table' order by name",
      tableRowSchema,
    )
  )
    .map(({ name }) => name)
    .filter((name) => !INTERNAL_TABLE_PREFIXES.some((prefix) => name.startsWith(prefix)));

const tableShapeOf = async (database: D1Database, table: string) => {
  const columns = await rowsOf(database, `pragma table_xinfo(${quoted(table)})`, columnRowSchema);
  const indexes = await rowsOf(database, `pragma index_list(${quoted(table)})`, indexRowSchema);
  const foreignKeys = await rowsOf(
    database,
    `pragma foreign_key_list(${quoted(table)})`,
    foreignKeyRowSchema,
  );
  return {
    table,
    columns: columns.toSorted(byName),
    indexes: await Promise.all(
      indexes.toSorted(byName).map(async ({ name, unique, origin, partial }) => ({
        name: origin === "c" ? name : `${origin}:${table}`,
        unique,
        origin,
        partial,
        columns: await indexColumnsOf(database, name),
      })),
    ),
    foreignKeys: foreignKeys
      .map(({ table: target, from, to, on_update, on_delete }) => ({
        target,
        from,
        to,
        on_update,
        on_delete,
      }))
      .toSorted((left, right) => left.from.localeCompare(right.from)),
  };
};

export type TableShape = Awaited<ReturnType<typeof tableShapeOf>>;

export const schemaShapeOf = async (database: D1Database): Promise<readonly TableShape[]> =>
  Promise.all((await userTablesOf(database)).map((table) => tableShapeOf(database, table)));
