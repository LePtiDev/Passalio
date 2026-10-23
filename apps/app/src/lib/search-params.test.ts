import { describe, expect, it } from "vitest";
import * as z from "zod";
import { textParam } from "./search-params";

describe("textParam", () => {
  const department = textParam(z.string().regex(/^\d{2}$/));

  it("keeps text that the router read as a number", () => {
    expect(department.parse(94)).toBe("94");
    expect(department.parse("94")).toBe("94");
  });

  it("still applies the inner rule", () => {
    expect(department.safeParse(940).success).toBe(false);
  });
});
