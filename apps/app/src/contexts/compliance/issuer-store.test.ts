import { describe, expect, it } from "vitest";
import { createTestDatabase } from "@/lib/db/test-database";
import { sampleIssuer } from "@/test-support/certificate-records";
import { readIssuer, saveIssuer } from "./issuer-store";

const AT = new Date("2026-10-25T08:00:00.000Z");

describe("issuer store", () => {
  it("has no issuer before the first save", async () => {
    expect(await readIssuer(createTestDatabase())).toBeUndefined();
  });

  it("keeps the last saved issuer with its date", async () => {
    const database = createTestDatabase();
    expect(await saveIssuer(database, sampleIssuer(), AT)).toBe(true);
    expect(await readIssuer(database)).toEqual(sampleIssuer());
    expect(await database.localSettings.get("issuer")).toMatchObject({
      savedAt: "2026-10-25T08:00:00.000Z",
    });
  });

  it("does not rewrite an unchanged issuer", async () => {
    const database = createTestDatabase();
    await saveIssuer(database, sampleIssuer(), AT);
    expect(await saveIssuer(database, sampleIssuer(), new Date())).toBe(false);
    expect(await database.localSettings.get("issuer")).toMatchObject({
      savedAt: "2026-10-25T08:00:00.000Z",
    });
  });

  it("replaces the issuer when a setting changed", async () => {
    const database = createTestDatabase();
    await saveIssuer(database, sampleIssuer(), AT);
    const changed = sampleIssuer({ company: null, missingLegalMentions: ["siret"] });
    expect(await saveIssuer(database, changed, AT)).toBe(true);
    expect(await readIssuer(database)).toEqual(changed);
  });
});
