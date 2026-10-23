import * as z from "zod";

export const textParam = <Schema extends z.ZodType<string, string>>(schema: Schema) =>
  z.union([z.string(), z.number()]).transform(String).pipe(schema);
