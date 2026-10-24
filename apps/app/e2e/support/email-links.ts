import { readFile } from "node:fs/promises";
import { expect } from "@playwright/test";
import * as z from "zod";
import { API_LOG_PATH } from "../../playwright.config";

export const EMAIL_KINDS = [
  "magic_link",
  "invitation",
  "password_reset",
  "team_invitation",
] as const;

export type EmailKind = (typeof EMAIL_KINDS)[number];

const loggedEmail = z.object({
  event: z.literal("email_logged"),
  kind: z.enum(EMAIL_KINDS),
  url: z.string(),
});

const parsedLine = (line: string) => {
  const start = line.indexOf("{");
  if (start < 0) {
    return undefined;
  }
  try {
    const parsed = loggedEmail.safeParse(JSON.parse(line.slice(start)));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
};

export const emailLinks = async (kind: EmailKind, logPath = API_LOG_PATH) => {
  const lines = (await readFile(logPath, "utf8")).split("\n");
  return lines.flatMap((line) => {
    const email = parsedLine(line);
    return email !== undefined && email.kind === kind ? [email.url] : [];
  });
};

export const lastEmailLink = async (kind: EmailKind, logPath = API_LOG_PATH) => {
  const last = (await emailLinks(kind, logPath)).at(-1);
  if (last === undefined) {
    throw new Error(`No ${kind} email logged in ${logPath}`);
  }
  return last;
};

export const emailLinkSentBy = async (
  kind: EmailKind,
  send: () => Promise<void>,
  logPath = API_LOG_PATH,
) => {
  const before = (await emailLinks(kind, logPath)).length;
  await send();
  await expect.poll(async () => (await emailLinks(kind, logPath)).length).toBeGreaterThan(before);
  return lastEmailLink(kind, logPath);
};
