import { describe, expect, it } from "vitest";
import * as z from "zod";
import { createTestDatabase } from "@/lib/db/test-database";
import { signingDeviceIdOf } from "./signing-device";

describe("signingDeviceIdOf", () => {
  it("creates a device id once and keeps it", async () => {
    const database = createTestDatabase();
    const first = await signingDeviceIdOf(database);
    expect(z.uuid().safeParse(first).success).toBe(true);
    expect(await signingDeviceIdOf(database)).toBe(first);
  });

  it("gives each local database its own device id", async () => {
    expect(await signingDeviceIdOf(createTestDatabase())).not.toBe(
      await signingDeviceIdOf(createTestDatabase()),
    );
  });
});
