import { describe, expect, it } from "vitest";
import { findChangesWithoutTests, isProductionPath } from "./required-tests.ts";
import type { FileChange } from "./test-changes.ts";

const changed = (path: string): FileChange => ({ path, removedLines: 0 });

const missingOf = (changes: readonly FileChange[], exemptions: readonly string[] = []) =>
  findChangesWithoutTests({ changes, exemptions });

describe("isProductionPath", () => {
  it.each([
    "apps/api/src/app.ts",
    "apps/app/src/contexts/customers/components/list/customer-list-screen.tsx",
    "apps/web/src/pages/index.astro",
    "packages/shared/src/permissions.ts",
    "packages/db/migrations/0007_plate_readings.sql",
  ])("counts %s as production code", (path) => {
    expect(isProductionPath(path)).toBe(true);
  });

  it.each([
    "apps/app/src/components/search-field.test.tsx",
    "apps/app/e2e/customers.spec.ts",
    "apps/api/test/test-platform.ts",
    "docs/adr/0023-tests-obligatoires.md",
    "apps/app/vite.config.ts",
    "package.json",
    "apps/app/src/styles.css",
  ])("does not count %s as production code", (path) => {
    expect(isProductionPath(path)).toBe(false);
  });
});

describe("findChangesWithoutTests", () => {
  it("refuses production code changed without any test", () => {
    expect(missingOf([changed("apps/api/src/app.ts"), changed("docs/ROADMAP.md")])).toEqual([
      "apps/api/src/app.ts",
    ]);
  });

  it("accepts production code that comes with a new or changed test", () => {
    expect(
      missingOf([changed("apps/api/src/app.ts"), changed("apps/api/src/app.test.ts")]),
    ).toEqual([]);
  });

  it("accepts production code that comes with a new Playwright journey", () => {
    expect(
      missingOf([changed("apps/app/src/routes/router.ts"), changed("apps/app/e2e/home.spec.ts")]),
    ).toEqual([]);
  });

  it("accepts a branch that changes only documentation or configuration", () => {
    expect(missingOf([changed("docs/ROADMAP.md"), changed("apps/app/vite.config.ts")])).toEqual([]);
  });

  it("accepts production code without tests when a commit gives a reason", () => {
    expect(missingOf([changed("apps/api/src/app.ts")], ["formatting only"])).toEqual([]);
  });

  it("does not accept an empty reason", () => {
    expect(missingOf([changed("apps/api/src/app.ts")], ["  "])).toEqual(["apps/api/src/app.ts"]);
  });

  it("does not count a test support file as a test", () => {
    expect(
      missingOf([changed("apps/api/src/app.ts"), changed("apps/api/test/test-platform.ts")]),
    ).toEqual(["apps/api/src/app.ts"]);
  });
});
