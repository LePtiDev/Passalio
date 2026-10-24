import { z } from "zod";
import type { RecordedStatement } from "./recording-d1";
import { indexColumnsOf, isUniqueIndex } from "./schema-shape";

export const GROWING_TABLES = [
  "customers",
  "sites",
  "equipments",
  "equipment_photos",
  "plate_readings",
  "interventions",
  "documents",
  "document_number_blocks",
  "members",
  "invitations",
  "audit_logs",
  "activity_days",
  "prospect_companies",
  "prospect_contacts",
  "prospect_events",
  "sessions",
] as const;

type GrowingTable = (typeof GROWING_TABLES)[number];

const GROWING: ReadonlySet<string> = new Set(GROWING_TABLES);

const isGrowingTable = (table: string): table is GrowingTable => GROWING.has(table);

const planRowSchema = z.object({ detail: z.string() });

const PLAN_STEP = /^(SCAN|SEARCH) (\S+)(?: USING (?:COVERING )?INDEX (\S+))?(?: \((.*)\))?/;

const TABLE_REFERENCE = /(?:from|join|update|into)\s+"?(\w+)"?(?:\s+(?:as\s+)?"?(\w+)"?)?/gi;

const SQL_KEYWORDS: ReadonlySet<string> = new Set([
  "where",
  "set",
  "on",
  "left",
  "inner",
  "join",
  "order",
  "group",
  "limit",
  "values",
  "select",
]);

export type PlanStep = {
  readonly detail: string;
  readonly table: string;
  readonly isFullScan: boolean;
  readonly index: string | undefined;
  readonly constraints: readonly string[];
};

export type ExplainedStatement = RecordedStatement & {
  readonly plan: readonly string[];
  readonly steps: readonly PlanStep[];
};

const aliasesOf = (sql: string): ReadonlyMap<string, string> => {
  const aliases = new Map<string, string>();
  for (const [, table, alias] of sql.matchAll(TABLE_REFERENCE)) {
    if (table === undefined) {
      continue;
    }
    aliases.set(table, table);
    if (alias !== undefined && !SQL_KEYWORDS.has(alias.toLowerCase())) {
      aliases.set(alias, table);
    }
  }
  return aliases;
};

const stepOf = (detail: string, aliases: ReadonlyMap<string, string>): PlanStep[] => {
  const match = PLAN_STEP.exec(detail);
  const [, kind, name, index, constraints] = match ?? [];
  if (kind === undefined || name === undefined) {
    return [];
  }
  return [
    {
      detail,
      table: aliases.get(name) ?? name,
      isFullScan: kind === "SCAN",
      index,
      constraints: constraints === undefined ? [] : constraints.split(" AND "),
    },
  ];
};

export const isReadOrWrite = ({ sql }: RecordedStatement) =>
  /^\s*(select|update|delete|insert)\b/i.test(sql);

export const explain = async (
  database: D1Database,
  statement: RecordedStatement,
): Promise<ExplainedStatement> => {
  const result = await database
    .prepare(`explain query plan ${statement.sql}`)
    .bind(...statement.params)
    .all();
  const plan = z
    .array(planRowSchema)
    .parse(result.results)
    .map(({ detail }) => detail);
  const aliases = aliasesOf(statement.sql);
  return { ...statement, plan, steps: plan.flatMap((detail) => stepOf(detail, aliases)) };
};

export const fullScansOfGrowingTables = (statement: ExplainedStatement) =>
  statement.steps
    .filter(
      ({ table, isFullScan, index }) => isFullScan && index === undefined && isGrowingTable(table),
    )
    .map(({ detail }) => detail);

const ORDER_BY_IN_TEMPORARY_TREE = "USE TEMP B-TREE FOR ORDER BY";

const isPagedIndexWalk = (statement: ExplainedStatement, step: PlanStep) =>
  /\blimit\b/i.test(statement.sql) &&
  statement.plan.at(0) === step.detail &&
  !statement.plan.includes(ORDER_BY_IN_TEMPORARY_TREE);

export const wholeIndexReadsOfGrowingTables = (statement: ExplainedStatement) =>
  statement.steps
    .filter(
      (step) =>
        step.isFullScan &&
        step.index !== undefined &&
        isGrowingTable(step.table) &&
        !isPagedIndexWalk(statement, step),
    )
    .map(({ detail }) => detail);

export const organizationFilteredTables = ({ sql }: RecordedStatement): readonly string[] =>
  [...sql.matchAll(/"(\w+)"\."organization_id"\s*(?:=|in\b)/gi)]
    .map(([, table]) => table ?? "")
    .filter(
      (table, position, tables) => isGrowingTable(table) && tables.indexOf(table) === position,
    );

const isSingleRowLookup = async (database: D1Database, step: PlanStep) => {
  if (step.index === undefined || !(await isUniqueIndex(database, step.table, step.index))) {
    return false;
  }
  const columns = await indexColumnsOf(database, step.index);
  return columns.every((column) => step.constraints.includes(`${column}=?`));
};

const startsWithOrganization = async (database: D1Database, step: PlanStep) =>
  step.index !== undefined &&
  (await indexColumnsOf(database, step.index)).at(0) === "organization_id" &&
  step.constraints.at(0) === "organization_id=?";

export const stepsNotUsingOrganizationIndex = async (
  database: D1Database,
  statement: ExplainedStatement,
): Promise<readonly string[]> => {
  const filtered = new Set(organizationFilteredTables(statement));
  const checked = await Promise.all(
    statement.steps
      .filter(({ table }) => filtered.has(table))
      .map(async (step) => ({
        detail: step.detail,
        isAllowed:
          !step.isFullScan &&
          ((await startsWithOrganization(database, step)) ||
            (await isSingleRowLookup(database, step))),
      })),
  );
  return checked.filter(({ isAllowed }) => !isAllowed).map(({ detail }) => detail);
};
