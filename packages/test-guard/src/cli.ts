import { execFileSync } from "node:child_process";
import { findChangesWithoutTests, NO_TESTS_TRAILER } from "./required-tests.ts";
import { APPROVAL_TRAILER, findUnapprovedChanges, parseNumstat } from "./test-changes.ts";

const BASE_REFERENCES = ["origin/main", "main"] as const;

const git = (args: readonly string[]): string =>
  execFileSync("git", args, { encoding: "utf8" }).trim();

const succeeds = (args: readonly string[]): boolean => {
  try {
    execFileSync("git", args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const lines = (output: string): string[] => output.split("\n").filter((line) => line !== "");

const mergeBase = (): string | undefined => {
  const reference = BASE_REFERENCES.find((candidate) =>
    succeeds(["merge-base", "HEAD", candidate]),
  );
  return reference === undefined ? undefined : git(["merge-base", "HEAD", reference]);
};

const commitApproval = (sha: string) => ({
  approvals: lines(
    git([
      "log",
      "-1",
      `--format=%(trailers:key=${APPROVAL_TRAILER},valueonly,separator=%x0A)`,
      sha,
    ]),
  ),
  paths: lines(git(["diff-tree", "--no-commit-id", "--name-only", "-r", "--root", sha])),
});

const base = mergeBase();
if (base === undefined) {
  process.stderr.write("test:guard : branche main introuvable, vérification impossible.\n");
  process.exit(1);
}

const changes = parseNumstat(git(["diff", "--numstat", "--no-renames", base]));
const commitShas = lines(git(["rev-list", `${base}..HEAD`]));

const unapproved = findUnapprovedChanges({
  changes,
  existedOnBase: (path) => succeeds(["cat-file", "-e", `${base}:${path}`]),
  commits: commitShas.map(commitApproval),
});

if (unapproved.length > 0) {
  process.stderr.write(
    [
      "test:guard : des tests existants ont été modifiés ou supprimés sans l'accord de Quentin.",
      ...unapproved.map((path) => `  - ${path}`),
      `Ajoutez la ligne « ${APPROVAL_TRAILER}: <lien vers son message> » au commit qui les change,`,
      "ou annulez la modification. Voir docs/adr/0020-strategie-de-tests.md.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const exemptionsOf = (sha: string): string[] =>
  lines(
    git([
      "log",
      "-1",
      `--format=%(trailers:key=${NO_TESTS_TRAILER},valueonly,separator=%x0A)`,
      sha,
    ]),
  );

const withoutTests = findChangesWithoutTests({
  changes,
  exemptions: commitShas.flatMap(exemptionsOf),
});

if (withoutTests.length > 0) {
  process.stderr.write(
    [
      "test:guard : du code de production change sans aucun test ajouté ou complété.",
      ...withoutTests.map((path) => `  - ${path}`),
      "Écrivez les tests de ce comportement dans la même branche,",
      `ou ajoutez la ligne « ${NO_TESTS_TRAILER}: <raison> » si rien ne change pour l'utilisateur.`,
      "Voir docs/adr/0023-tests-obligatoires.md.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
