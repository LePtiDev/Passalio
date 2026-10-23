export const APPROVAL_TRAILER = "Test-Change-Approved";

const TEST_FILE = /\.(test|spec)\.tsx?$/;
const REFERENCE_CAPTURE = /(^|\/)(__screenshots__|[^/]+-snapshots)\//;
const APPROVAL_LINK = /^https:\/\/\S+$/;

export type FileChange = {
  readonly path: string;
  readonly removedLines: number | "binary";
};

export type CommitApproval = {
  readonly approvals: readonly string[];
  readonly paths: readonly string[];
};

type UnapprovedChangesInput = {
  readonly changes: readonly FileChange[];
  readonly existedOnBase: (path: string) => boolean;
  readonly commits: readonly CommitApproval[];
};

export const isProtectedPath = (path: string): boolean =>
  TEST_FILE.test(path) || REFERENCE_CAPTURE.test(path);

export const isApprovalLink = (value: string): boolean => APPROVAL_LINK.test(value.trim());

export const parseNumstat = (output: string): FileChange[] =>
  output
    .split("\n")
    .filter((line) => line.trim() !== "")
    .flatMap((line) => {
      const [, removed, ...pathParts] = line.split("\t");
      const path = pathParts.join("\t");
      if (removed === undefined || path === "") {
        return [];
      }
      return [{ path, removedLines: removed === "-" ? "binary" : Number(removed) }];
    });

const isRewrite = (change: FileChange): boolean =>
  change.removedLines === "binary" || change.removedLines > 0;

export const findUnapprovedChanges = ({
  changes,
  existedOnBase,
  commits,
}: UnapprovedChangesInput): string[] => {
  const approvedPaths = new Set(
    commits
      .filter((commit) => commit.approvals.some(isApprovalLink))
      .flatMap((commit) => commit.paths),
  );
  return changes
    .filter(
      (change) =>
        isProtectedPath(change.path) &&
        isRewrite(change) &&
        existedOnBase(change.path) &&
        !approvedPaths.has(change.path),
    )
    .map((change) => change.path);
};
