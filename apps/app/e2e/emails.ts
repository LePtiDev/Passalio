import { readFile } from "node:fs/promises";
import * as z from "zod";

const loggedEmail = z.object({
  event: z.literal("email_logged"),
  kind: z.string(),
  url: z.string(),
});

type EmailKind = "magic_link" | "invitation" | "password_reset";

const loggedLinks = async (logPath: string, kind: EmailKind) => {
  const lines = (await readFile(logPath, "utf8")).split("\n");
  const links = lines.flatMap((line) => {
    const start = line.indexOf("{");
    if (start < 0) {
      return [];
    }
    try {
      const parsed = loggedEmail.safeParse(JSON.parse(line.slice(start)));
      return parsed.success && parsed.data.kind === kind ? [parsed.data.url] : [];
    } catch {
      return [];
    }
  });
  return links;
};

export const countEmailLinks = async (logPath: string, kind: EmailKind) =>
  (await loggedLinks(logPath, kind)).length;

export const lastEmailLink = async (logPath: string, kind: EmailKind) => {
  const last = (await loggedLinks(logPath, kind)).at(-1);
  if (last === undefined) {
    throw new Error(`No ${kind} email logged`);
  }
  return last;
};
