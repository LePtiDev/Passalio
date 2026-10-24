import { z } from "zod";
import { schemaShapeOf, type TableShape } from "./schema-shape";

const countSchema = z.object({ rows: z.number() });

type Column = TableShape["columns"][number];

const quoted = (name: string) => `"${name.replaceAll('"', '""')}"`;

const dependenciesFirst = (shapes: readonly TableShape[]): readonly TableShape[] => {
  const ordered: TableShape[] = [];
  const pending = [...shapes];
  while (pending.length > 0) {
    const placed = new Set(ordered.map(({ table }) => table));
    const ready = pending.findIndex(({ table, foreignKeys }) =>
      foreignKeys.every(({ target }) => target === table || placed.has(target)),
    );
    const [next] = pending.splice(Math.max(ready, 0), 1);
    if (next !== undefined) {
      ordered.push(next);
    }
  }
  return ordered;
};

const valueOf = (column: Column, table: string, round: number, position: number) =>
  /int|real|num/i.test(column.type) ? round * 1000 + position : `${table}.${column.name}.${round}`;

const rowOf = (
  { table, columns, foreignKeys }: TableShape,
  round: number,
  written: ReadonlyMap<string, ReadonlyMap<string, string | number | null>>,
) => {
  const stored = columns.filter(({ hidden }) => hidden === 0);
  const ownValue = (name: string) => {
    const position = stored.findIndex((column) => column.name === name);
    const column = stored[position];
    return column === undefined ? null : valueOf(column, table, round, position);
  };
  return new Map(
    stored.map((column, position) => {
      const reference = foreignKeys.find(({ from }) => from === column.name);
      if (reference === undefined) {
        return [column.name, valueOf(column, table, round, position)] as const;
      }
      const to = reference.to ?? "id";
      const referenced =
        reference.target === table
          ? ownValue(to)
          : (written.get(reference.target)?.get(to) ?? null);
      return [column.name, referenced] as const;
    }),
  );
};

export const insertOneRowPerTable = async (
  database: D1Database,
  round: number,
): Promise<readonly string[]> => {
  const shapes = dependenciesFirst(await schemaShapeOf(database));
  const written = new Map<string, ReadonlyMap<string, string | number | null>>();
  const statements = shapes.map((shape) => {
    const row = rowOf(shape, round, written);
    written.set(shape.table, row);
    const names = [...row.keys()];
    return database
      .prepare(
        `insert into ${quoted(shape.table)} (${names.map(quoted).join(", ")}) values (${names.map(() => "?").join(", ")})`,
      )
      .bind(...row.values());
  });
  await database.batch(statements);
  return shapes.map(({ table }) => table);
};

export const rowCountsOf = async (database: D1Database): Promise<ReadonlyMap<string, number>> => {
  const shapes = await schemaShapeOf(database);
  const counts = await Promise.all(
    shapes.map(async ({ table }) => {
      const row = countSchema.parse(
        await database.prepare(`select count(*) as rows from ${quoted(table)}`).first(),
      );
      return [table, row.rows] as const;
    }),
  );
  return new Map(counts);
};
