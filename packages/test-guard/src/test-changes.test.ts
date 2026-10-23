import { describe, expect, it } from "vitest";
import {
  findUnapprovedChanges,
  isApprovalLink,
  isProtectedPath,
  parseNumstat,
  type CommitApproval,
  type FileChange,
} from "./test-changes.ts";

const APPROVAL = "https://claude.ai/code/project/chan_x?thread=cmsg_y";
const existing = (): boolean => true;
const brandNew = (): boolean => false;

const unapprovedOf = (
  changes: readonly FileChange[],
  commits: readonly CommitApproval[] = [],
  existedOnBase: (path: string) => boolean = existing,
) => findUnapprovedChanges({ changes, existedOnBase, commits });

describe("isProtectedPath", () => {
  it.each([
    "apps/api/test/customer-routes.test.ts",
    "apps/app/src/components/search-field.test.tsx",
    "apps/app/e2e/customers.spec.ts",
    "apps/app/e2e/customers.spec.ts-snapshots/list-mobile.png",
    "apps/app/src/components/__screenshots__/card.png",
  ])("protects %s", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each([
    "apps/api/src/app.ts",
    "apps/api/test/test-platform.ts",
    "docs/TESTING.md",
    "apps/app/src/latest.ts",
  ])("leaves %s free", (path) => {
    expect(isProtectedPath(path)).toBe(false);
  });
});

describe("isApprovalLink", () => {
  it("accepts an https link", () => {
    expect(isApprovalLink(APPROVAL)).toBe(true);
  });

  it.each(["", "ok", "oui Quentin", "http://example.com", "https://"])("refuses %j", (value) => {
    expect(isApprovalLink(value)).toBe(false);
  });
});

describe("parseNumstat", () => {
  it("reads added and removed lines, binary files and paths with tabs", () => {
    expect(parseNumstat("3\t0\ta.test.ts\n-\t-\tshot.png\n1\t2\tweird\tname.ts\n\n")).toEqual([
      { path: "a.test.ts", removedLines: 0 },
      { path: "shot.png", removedLines: "binary" },
      { path: "weird\tname.ts", removedLines: 2 },
    ]);
  });

  it("returns nothing for an empty diff", () => {
    expect(parseNumstat("")).toEqual([]);
  });
});

describe("findUnapprovedChanges", () => {
  it("allows adding lines to an existing test file", () => {
    expect(unapprovedOf([{ path: "a.test.ts", removedLines: 0 }])).toEqual([]);
  });

  it("allows a brand new test file", () => {
    expect(unapprovedOf([{ path: "new.test.ts", removedLines: 0 }], [], brandNew)).toEqual([]);
  });

  it("blocks a removed or modified line in an existing test file", () => {
    expect(unapprovedOf([{ path: "a.test.ts", removedLines: 1 }])).toEqual(["a.test.ts"]);
  });

  it("blocks a deleted test file", () => {
    expect(unapprovedOf([{ path: "gone.spec.ts", removedLines: 40 }])).toEqual(["gone.spec.ts"]);
  });

  it("blocks a changed reference capture", () => {
    const capture = "e2e/clients.spec.ts-snapshots/list.png";
    expect(unapprovedOf([{ path: capture, removedLines: "binary" }])).toEqual([capture]);
  });

  it("ignores changes to production code", () => {
    expect(unapprovedOf([{ path: "src/app.ts", removedLines: 30 }])).toEqual([]);
  });

  it("accepts a change made in a commit carrying an approval link", () => {
    const commits = [{ approvals: [APPROVAL], paths: ["a.test.ts"] }];
    expect(unapprovedOf([{ path: "a.test.ts", removedLines: 4 }], commits)).toEqual([]);
  });

  it("refuses an approval that is not a link", () => {
    const commits = [{ approvals: ["ok"], paths: ["a.test.ts"] }];
    expect(unapprovedOf([{ path: "a.test.ts", removedLines: 4 }], commits)).toEqual(["a.test.ts"]);
  });

  it("does not let an approval for one file cover another file", () => {
    const commits = [{ approvals: [APPROVAL], paths: ["a.test.ts"] }];
    const changes = [
      { path: "a.test.ts", removedLines: 1 },
      { path: "b.test.ts", removedLines: 1 },
    ];
    expect(unapprovedOf(changes, commits)).toEqual(["b.test.ts"]);
  });
});
