import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import { parseCsv, recordsOf } from "./prospects/csv.ts";
import { geocodeAll } from "./prospects/geocode.ts";
import { importedCompanyOf, type ImportedCompany } from "./prospects/prospect-rows.ts";
import { importStatements } from "./prospects/prospect-sql.ts";

const ENVIRONMENTS = ["local", "staging", "production"] as const;
type Environment = (typeof ENVIRONMENTS)[number];

const isEnvironment = (value: string | undefined): value is Environment =>
  ENVIRONMENTS.some((environment) => environment === value);

const fail = (message: string): never => {
  console.error(`\n${message}`);
  process.exit(1);
};

const wranglerTarget = (environment: Environment): readonly string[] =>
  environment === "local" ? ["--local"] : ["--remote", "--env", environment];

const confirmProduction = async () => {
  const prompt = createInterface({ input: stdin, output: stdout });
  const answer = await prompt.question('\nTapez "production" pour confirmer : ');
  prompt.close();
  if (answer.trim() !== "production") {
    fail("Import annulé.");
  }
};

const uniqueById = (companies: readonly ImportedCompany[]) => [
  ...new Map(companies.map((company) => [company.id, company])).values(),
];

const { values } = parseArgs({ options: { env: { type: "string" }, file: { type: "string" } } });

if (!isEnvironment(values.env)) {
  fail(`Environnement inconnu. Utilisez --env ${ENVIRONMENTS.join(" | ")}.`);
} else if (values.file === undefined) {
  fail("Fichier manquant. Utilisez --file chemin/vers/ramoneurs-a-appeler.csv.");
} else {
  const environment = values.env;
  const records = recordsOf(parseCsv(readFileSync(values.file, "utf8")));
  const companies = uniqueById(records.flatMap((record) => importedCompanyOf(record) ?? []));
  console.info(`\n${records.length} lignes lues, ${companies.length} entreprises à importer.`);
  const positions = await geocodeAll(companies);
  console.info(`${positions.size} entreprises placées sur la carte.`);
  if (environment === "production") {
    await confirmProduction();
  }
  const directory = mkdtempSync(join(tmpdir(), "passalio-prospects-"));
  const sqlFile = join(directory, "prospects.sql");
  writeFileSync(sqlFile, importStatements(companies, positions, Date.now()).join("\n"));
  try {
    execFileSync(
      "pnpm",
      [
        "exec",
        "wrangler",
        "d1",
        "execute",
        "DB",
        ...wranglerTarget(environment),
        "--yes",
        "--file",
        sqlFile,
      ],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  console.info(
    `\nImport terminé sur ${environment}. Les étapes et les notes déjà saisies sont gardées.`,
  );
}
