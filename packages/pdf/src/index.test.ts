import { describe, expect, it } from "vitest";
import { createEmptyPdf } from "./index";

describe("createEmptyPdf", () => {
  it("produces a valid PDF header", async () => {
    const bytes = await createEmptyPdf();
    expect(String.fromCodePoint(...bytes.slice(0, 5))).toBe("%PDF-");
  });
});
