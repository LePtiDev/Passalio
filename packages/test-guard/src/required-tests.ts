import { isProtectedPath, type FileChange } from "./test-changes.ts";

export const NO_TESTS_TRAILER = "Tests-Not-Needed";

const PRODUCTION_SOURCE = /^(apps|packages)\/[^/]+\/src\/.+\.(tsx?|astro)$/;
const MIGRATION = /^packages\/db\/migrations\/.+\.sql$/;

type MissingTestsInput = {
  readonly changes: readonly FileChange[];
  readonly exemptions: readonly string[];
};

export const isProductionPath = (path: string): boolean =>
  !isProtectedPath(path) && (PRODUCTION_SOURCE.test(path) || MIGRATION.test(path));

export const findChangesWithoutTests = ({ changes, exemptions }: MissingTestsInput): string[] => {
  const hasExemption = exemptions.some((reason) => reason.trim() !== "");
  const hasTestChange = changes.some((change) => isProtectedPath(change.path));
  if (hasExemption || hasTestChange) {
    return [];
  }
  return changes.filter((change) => isProductionPath(change.path)).map((change) => change.path);
};
