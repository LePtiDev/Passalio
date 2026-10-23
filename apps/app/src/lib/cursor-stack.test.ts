import { describe, expect, it } from "vitest";
import { FIRST_PAGE, popCursor, pushCursor } from "./cursor-stack";

describe("cursor stack", () => {
  it("goes forward and back to the cursor of each page", () => {
    const third = pushCursor(pushCursor(FIRST_PAGE, "a"), "b");
    expect(third).toEqual([null, "a", "b"]);
    expect(popCursor(third)).toEqual([null, "a"]);
  });

  it("stays on the first page when going back from it", () => {
    expect(popCursor(FIRST_PAGE)).toEqual([null]);
  });
});
