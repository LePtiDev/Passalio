import { describe, expect, it } from "vitest";
import {
  decodeAccountCursor,
  decodeJournalCursor,
  encodeAccountCursor,
  encodeJournalCursor,
} from "./backoffice-cursors";

describe("account cursor", () => {
  it("reads back the name and id it was made of", () => {
    const cursor = { name: "Ramonage A", id: "organization-a" };
    expect(decodeAccountCursor(encodeAccountCursor(cursor))).toEqual(cursor);
  });

  it("keeps a name that contains the separator", () => {
    const cursor = { name: "Ramonage | Fils", id: "organization-a" };
    expect(decodeAccountCursor(encodeAccountCursor(cursor))).toEqual(cursor);
  });

  it.each([undefined, "no-separator"])("ignores the cursor %s", (cursor) => {
    expect(decodeAccountCursor(cursor)).toBeUndefined();
  });
});

describe("journal cursor", () => {
  it("reads back the date and id it was made of", () => {
    const cursor = { createdAt: new Date("2026-10-23T10:00:00.123Z"), id: "entry-1" };
    expect(decodeJournalCursor(encodeJournalCursor(cursor))).toEqual(cursor);
  });

  it.each([undefined, "no-separator", "yesterday|entry-1", "1.5|entry-1"])(
    "ignores the cursor %s",
    (cursor) => {
      expect(decodeJournalCursor(cursor)).toBeUndefined();
    },
  );
});
