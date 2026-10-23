import { z } from "zod";
import { GROWING_TABLES, type ExplainedStatement } from "./query-plan";
import type { RecordedStatement } from "./recording-d1";
import { userTablesOf } from "./schema-shape";

const TABLE_REFERENCE = /\b(?:from|join|update)\s+"(\w+)"(?:\s+(?:as\s+)?"(\w+)")?/gi;

const AUTOMATIC_INDEX = /^SEARCH (\S+) USING AUTOMATIC (?:COVERING |PARTIAL )*INDEX/;

const GROWING: ReadonlySet<string> = new Set(GROWING_TABLES);

const columnNameSchema = z.object({ name: z.string() });

export const organizationTablesOf = async (database: D1Database): Promise<ReadonlySet<string>> => {
  const tables = await userTablesOf(database);
  const withOrganization = await Promise.all(
    tables.map(async (table) => {
      const columns = z
        .array(columnNameSchema)
        .parse(
          (await database.prepare(`pragma table_info('${table.replaceAll("'", "''")}')`).all())
            .results,
        );
      return columns.some(({ name }) => name === "organization_id") ? [table] : [];
    }),
  );
  return new Set(withOrganization.flat());
};

const isInsert = ({ sql }: RecordedStatement) => /^\s*insert\b/i.test(sql);

const namesOfReferences = (sql: string) => {
  const names = new Map<string, Set<string>>();
  for (const [, table, alias] of sql.matchAll(TABLE_REFERENCE)) {
    if (table === undefined) {
      continue;
    }
    const known = names.get(table) ?? new Set([table]);
    if (alias !== undefined) {
      known.add(alias);
    }
    names.set(table, known);
  }
  return names;
};

const filtersOrganizationOf = (sql: string, name: string) =>
  sql.includes(`"${name}"."organization_id" = ?`) ||
  sql.includes(`"${name}"."organization_id" in (`);

export const tablesReadWithoutOrganizationFilter = (
  statement: RecordedStatement,
  organizationTables: ReadonlySet<string>,
): readonly string[] =>
  isInsert(statement)
    ? []
    : [...namesOfReferences(statement.sql)]
        .filter(([table]) => organizationTables.has(table))
        .filter(
          ([, names]) => ![...names].some((name) => filtersOrganizationOf(statement.sql, name)),
        )
        .map(([table]) => table);

export const automaticIndexesOnGrowingTables = (statement: ExplainedStatement) =>
  statement.steps
    .filter(({ detail, table }) => AUTOMATIC_INDEX.test(detail) && GROWING.has(table))
    .map(({ detail }) => detail);
