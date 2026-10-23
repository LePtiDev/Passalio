import { describe, expect, it } from "vitest";
import { decodeNameCursor, encodeNameCursor, pageOf } from "./prospect-cursors";

const rows = [
  { searchName: "a", id: "1" },
  { searchName: "b", id: "2" },
  { searchName: "c", id: "3" },
];

describe("name cursor", () => {
  it("reads back the search name and id it was made of", () => {
    const cursor = { searchName: "gaz hop", id: "company-1" };
    expect(decodeNameCursor(encodeNameCursor(cursor))).toEqual(cursor);
  });

  it("keeps a search name that contains the separator", () => {
    const cursor = { searchName: "a|b", id: "company-1" };
    expect(decodeNameCursor(encodeNameCursor(cursor))).toEqual(cursor);
  });

  it.each([undefined, "no-separator"])("ignores the cursor %s", (cursor) => {
    expect(decodeNameCursor(cursor)).toBeUndefined();
  });
});

describe("pageOf", () => {
  it("shows the requested size and points after the last visible row when more rows exist", () => {
    expect(pageOf(rows, 2)).toEqual({ visible: rows.slice(0, 2), nextCursor: "b|2" });
  });

  it("has no next cursor when every row fits", () => {
    expect(pageOf(rows, 3)).toEqual({ visible: rows, nextCursor: null });
  });

  it("has no next cursor for an empty page", () => {
    expect(pageOf([], 3)).toEqual({ visible: [], nextCursor: null });
  });
});
