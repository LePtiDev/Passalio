import { execFileSync } from "node:child_process";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

const ENVIRONMENTS = ["staging", "production"] as const;

type Environment = (typeof ENVIRONMENTS)[number];

const isEnvironment = (value: string | undefined): value is Environment =>
  ENVIRONMENTS.some((environment) => environment === value);

const run = (
  command: string,
  args: readonly string[],
  env: Readonly<Record<string, string>> = {},
): void => {
  console.info(`\n> ${command} ${args.join(" ")}`);
  execFileSync(command, args, { stdio: "inherit", env: { ...process.env, ...env } });
};

const read = (command: string, args: readonly string[]): string =>
  execFileSync(command, args, { encoding: "utf8" }).trim();

const fail = (message: string): never => {
  console.error(`\n${message}`);
  process.exit(1);
};

const assertProductionReady = async (): Promise<void> => {
  if (read("git", ["branch", "--show-current"]) !== "main") {
    fail("La production se déploie uniquement depuis la branche main.");
  }
  if (read("git", ["status", "--porcelain"]) !== "") {
    fail("Des modifications ne sont pas commitées. Commitez ou mettez-les de côté.");
  }
  run("git", ["fetch", "origin", "main"]);
  if (read("git", ["rev-parse", "HEAD"]) !== read("git", ["rev-parse", "origin/main"])) {
    fail("La branche main locale n'est pas à jour avec origin/main.");
  }
  const prompt = createInterface({ input: stdin, output: stdout });
  const answer = await prompt.question('\nTapez "production" pour confirmer le déploiement : ');
  prompt.close();
  if (answer.trim() !== "production") {
    fail("Déploiement annulé.");
  }
};

const release = async (environment: Environment): Promise<void> => {
  if (environment === "production") {
    await assertProductionReady();
  }
  run("pnpm", ["--workspace-root", "check"]);
  run("pnpm", ["--workspace-root", "--filter", "@passalio/app", "build"]);
  run("pnpm", [
    "exec",
    "wrangler",
    "d1",
    "migrations",
    "apply",
    "DB",
    "--remote",
    "--env",
    environment,
  ]);
  run("pnpm", ["exec", "wrangler", "deploy", "--env", environment]);
  run("pnpm", ["--workspace-root", "--filter", "@passalio/web", "build"], {
    PUBLIC_SITE_ENV: environment,
  });
  run("pnpm", [
    "exec",
    "wrangler",
    "deploy",
    "--config",
    "../web/wrangler.json",
    "--env",
    environment,
  ]);
  console.info(`\nDéploiement ${environment} terminé.`);
};

const environment = process.argv[2];

if (isEnvironment(environment)) {
  await release(environment);
} else {
  fail(`Environnement inconnu. Utilisez : ${ENVIRONMENTS.join(", ")}.`);
}
