import { validator } from "hono/validator";
import type * as z from "zod";

const parseWith =
  <Schema extends z.ZodType>(schema: Schema) =>
  (value: unknown, context: { json: (body: { error: string }, status: 400) => Response }) => {
    const parsed = schema.safeParse(value);
    return parsed.success ? parsed.data : context.json({ error: "invalid_request" }, 400);
  };

export const validateJson = <Schema extends z.ZodType>(schema: Schema) =>
  validator("json", (value, context): z.infer<Schema> | Response =>
    parseWith(schema)(value, context),
  );

export const validateParam = <Schema extends z.ZodType>(schema: Schema) =>
  validator("param", (value, context): z.infer<Schema> | Response =>
    parseWith(schema)(value, context),
  );

export const validateQuery = <Schema extends z.ZodType>(schema: Schema) =>
  validator("query", (value, context): z.infer<Schema> | Response =>
    parseWith(schema)(value, context),
  );
