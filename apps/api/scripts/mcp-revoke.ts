import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";

const ENVIRONMENTS = ["local", "staging", "production"] as const;
const EMAIL_PATTERN = /^[^\s'"@]+@[^\s'"@]+\.[^\s'"@]+$/;
const OAUTH_PREFIXES = ["grant", "token"] as const;

type Environment = (typeof ENVIRONMENTS)[number];

const isEnvironment = (value: string | undefined): value is Environment =>
  ENVIRONMENTS.some((environment) => environment === value);

const fail = (message: string): never => {
  console.error(`\n${message}`);
  process.exit(1);
};

const target = (environment: Environment): readonly string[] =>
  environment === "local" ? ["--local"] : ["--remote", "--env", environment];

const wrangler = (args: readonly string[]) =>
  execFileSync("pnpm", ["exec", "wrangler", ...args], { encoding: "utf8" });

const firstRowsOf = (output: unknown): readonly unknown[] => {
  if (!Array.isArray(output)) {
    return [];
  }
  const [first]: unknown[] = output;
  return typeof first === "object" &&
    first !== null &&
    "results" in first &&
    Array.isArray(first.results)
    ? first.results
    : [];
};

const sql = (environment: Environment, command: string): unknown =>
  JSON.parse(
    wrangler(["d1", "execute", "DB", ...target(environment), "--json", "--command", command]),
  );

const userIdOf = (environment: Environment, email: string): string | undefined => {
  const [row] = firstRowsOf(sql(environment, `SELECT id FROM users WHERE email = '${email}'`));
  return typeof row === "object" && row !== null && "id" in row && typeof row.id === "string"
    ? row.id
    : undefined;
};

const keyNamesOf = (output: string): string[] => {
  const parsed: unknown = JSON.parse(output);
  return Array.isArray(parsed)
    ? parsed.flatMap((entry: unknown) =>
        typeof entry === "object" &&
        entry !== null &&
        "name" in entry &&
        typeof entry.name === "string"
          ? [entry.name]
          : [],
      )
    : [];
};

const oauthKeysOf = (environment: Environment, userId: string) =>
  OAUTH_PREFIXES.flatMap((prefix) =>
    keyNamesOf(
      wrangler([
        "kv",
        "key",
        "list",
        "--binding",
        "OAUTH_KV",
        ...target(environment),
        "--prefix",
        `${prefix}:${userId}:`,
      ]),
    ),
  );

const { values } = parseArgs({
  options: { env: { type: "string" }, email: { type: "string" } },
});
const environment = values.env;
const email = values.email?.trim().toLowerCase();

if (!isEnvironment(environment)) {
  fail(`Environnement inconnu. Utilisez --env ${ENVIRONMENTS.join(" | ")}.`);
} else if (email === undefined || !EMAIL_PATTERN.test(email)) {
  fail("Adresse email invalide. Utilisez --email prenom@exemple.fr.");
} else {
  const userId = userIdOf(environment, email) ?? fail("Aucun compte avec cet email.");
  const keys = oauthKeysOf(environment, userId);
  for (const key of keys) {
    wrangler(["kv", "key", "delete", "--binding", "OAUTH_KV", ...target(environment), key]);
  }
  sql(
    environment,
    `INSERT INTO audit_logs (id, organization_id, actor_user_id, impersonator_user_id, action, target_type, target_id, data, trace_id, created_at) ` +
      `VALUES ('${randomUUID().replaceAll("-", "")}', NULL, NULL, NULL, 'mcp.revoked', 'user', '${userId}', ` +
      `json_object('source', 'command'), '${randomUUID().replaceAll("-", "")}', ${Date.now()})`,
  );
  console.info(
    `\nAccès MCP de ${email} coupés sur ${environment} (${keys.length} clés supprimées).`,
  );
}
