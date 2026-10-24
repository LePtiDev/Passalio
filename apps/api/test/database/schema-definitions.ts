import { z } from "zod";

const definitionSchema = z.object({
  type: z.string(),
  name: z.string(),
  tbl_name: z.string(),
  sql: z.string(),
});

export type SchemaDefinition = z.infer<typeof definitionSchema>;

const normalized = (sql: string) =>
  sql
    .replaceAll(/[`"[\]]/g, "")
    .replaceAll(/\s+/g, " ")
    .replaceAll(/\s*([(),])\s*/g, "$1")
    .trim()
    .toLowerCase();

export const definitionsOf = async (
  database: D1Database,
  types: readonly string[],
): Promise<readonly SchemaDefinition[]> =>
  z
    .array(definitionSchema)
    .parse(
      (
        await database
          .prepare(
            `select type, name, tbl_name, sql from sqlite_master where sql is not null and type in (${types.map(() => "?").join(", ")}) and tbl_name not like '\\_cf\\_%' escape '\\' and tbl_name not like 'd1\\_%' escape '\\' order by type, name`,
          )
          .bind(...types)
          .all()
      ).results,
    )
    .map((definition) => ({ ...definition, sql: normalized(definition.sql) }));
