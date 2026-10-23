import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";

const ENVIRONMENTS = ["local", "staging", "production"] as const;
const GRANTABLE_ROLES = ["superadmin", "admin", "sales"] as const;
const ACTIONS = ["grant", "revoke"] as const;
const EMAIL_PATTERN = /^[^\s'"@]+@[^\s'"@]+\.[^\s'"@]+$/;

type Environment = (typeof ENVIRONMENTS)[number];
type Action = (typeof ACTIONS)[number];

const isOneOf = <Value extends string>(
  values: readonly Value[],
  value: string | undefined,
): value is Value => values.some((candidate) => candidate === value);

const fail = (message: string): never => {
  console.error(`\n${message}`);
  process.exit(1);
};

const wranglerTarget = (environment: Environment): readonly string[] =>
  environment === "local" ? ["--local"] : ["--remote", "--env", environment];

const execute = (environment: Environment, sql: string): unknown =>
  JSON.parse(
    execFileSync(
      "pnpm",
      [
        "exec",
        "wrangler",
        "d1",
        "execute",
        "DB",
        ...wranglerTarget(environment),
        "--json",
        "--command",
        sql,
      ],
      { encoding: "utf8" },
    ),
  );

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

const roleOf = (environment: Environment, email: string): string | null | undefined => {
  const [row] = firstRowsOf(
    execute(environment, `SELECT role FROM users WHERE email = '${email}'`),
  );
  if (typeof row !== "object" || row === null || !("role" in row)) {
    return undefined;
  }
  return typeof row.role === "string" ? row.role : null;
};

const auditStatement = (action: string, email: string, role: string, now: number) =>
  `INSERT INTO audit_logs (id, organization_id, actor_user_id, impersonator_user_id, action, target_type, target_id, data, trace_id, created_at) ` +
  `SELECT '${randomUUID().replaceAll("-", "")}', NULL, NULL, NULL, '${action}', 'user', id, ` +
  `json_object('role', '${role}', 'source', 'command'), '${randomUUID().replaceAll("-", "")}', ${now} ` +
  `FROM users WHERE email = '${email}'`;

const statementsFor = (action: Action, email: string, role: string, now: number) =>
  action === "grant"
    ? [
        `UPDATE users SET role = '${role}', updated_at = ${now} WHERE email = '${email}'`,
        auditStatement("platform.role_granted", email, role, now),
      ]
    : [
        `UPDATE users SET role = 'user', updated_at = ${now} WHERE email = '${email}'`,
        `DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = '${email}')`,
        auditStatement("platform.role_revoked", email, role, now),
      ];

const confirmProduction = async () => {
  const prompt = createInterface({ input: stdin, output: stdout });
  const answer = await prompt.question('\nTapez "production" pour confirmer : ');
  prompt.close();
  if (answer.trim() !== "production") {
    fail("Opération annulée.");
  }
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    env: { type: "string" },
    email: { type: "string" },
    role: { type: "string", default: "superadmin" },
  },
});

const [action] = positionals;
const environment = values.env;
const email = values.email?.trim().toLowerCase();
const role = values.role;

if (!isOneOf(ACTIONS, action)) {
  fail(`Action inconnue. Utilisez : ${ACTIONS.join(", ")}.`);
} else if (!isOneOf(ENVIRONMENTS, environment)) {
  fail(`Environnement inconnu. Utilisez --env ${ENVIRONMENTS.join(" | ")}.`);
} else if (email === undefined || !EMAIL_PATTERN.test(email)) {
  fail("Adresse email invalide. Utilisez --email prenom@exemple.fr.");
} else if (!isOneOf(GRANTABLE_ROLES, role)) {
  fail(`Rôle inconnu. Utilisez --role ${GRANTABLE_ROLES.join(" | ")}.`);
} else {
  const currentRole = roleOf(environment, email);
  if (currentRole === undefined) {
    fail("Aucun compte avec cet email. Créez d'abord le compte depuis l'application.");
  }
  if (environment === "production") {
    await confirmProduction();
  }
  const auditedRole = action === "grant" ? role : (currentRole ?? "user");
  execute(environment, statementsFor(action, email, auditedRole, Date.now()).join("; "));
  const expected = action === "grant" ? role : "user";
  if (roleOf(environment, email) !== expected) {
    fail("Le rôle n'a pas été modifié. Vérifiez la base et réessayez.");
  }
  console.info(
    action === "grant"
      ? `\n${email} est maintenant ${role} sur ${environment}. La double authentification sera demandée à l'entrée de l'espace admin.`
      : `\n${email} n'a plus accès à l'espace admin sur ${environment}. Ses sessions sont fermées.`,
  );
}
