import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { API_LOG_PATH } from "../../playwright.config";

const run = promisify(execFile);

const API_DIRECTORY = resolve(import.meta.dirname, "../../../api");

const LOCAL_STATE_DIRECTORY = resolve(import.meta.dirname, "../..", dirname(API_LOG_PATH), "state");

const sqlText = (value: string) => `'${value.replaceAll("'", "''")}'`;

export const expireResetPasswordLinksOf = async (email: string) => {
  await run(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "DB",
      "--local",
      "--persist-to",
      LOCAL_STATE_DIRECTORY,
      "--command",
      `UPDATE verifications SET expires_at = 0 WHERE value IN (SELECT id FROM users WHERE email = ${sqlText(email)})`,
    ],
    { cwd: API_DIRECTORY, env: { ...process.env, CI: "true" } },
  );
};
