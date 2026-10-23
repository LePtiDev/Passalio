import { execFileSync } from "node:child_process";
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

const unapproved = findUnapprovedChanges({
  changes: parseNumstat(git(["diff", "--numstat", "--no-renames", base])),
  existedOnBase: (path) => succeeds(["cat-file", "-e", `${base}:${path}`]),
  commits: lines(git(["rev-list", `${base}..HEAD`])).map(commitApproval),
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
