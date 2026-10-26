import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as z from "zod";
import { adminAccessPolicyOf } from "../src/contexts/backoffice/http/admin-access-policy";

const WRANGLER_FILE = join(import.meta.dirname, "../wrangler.json");

const vars = z.object({ ADMIN_TWO_FACTOR_REQUIRED: z.string().optional() });
const wranglerConfig = z.object({
  vars,
  env: z.object({ staging: z.object({ vars }), production: z.object({ vars }) }),
});

const readWrangler = async () =>
  wranglerConfig.parse(JSON.parse(await readFile(WRANGLER_FILE, "utf8")));

describe("admin two-factor setting per environment", () => {
  it("is not required in staging and production", async () => {
    const wrangler = await readWrangler();
    expect(adminAccessPolicyOf(wrangler.env.staging.vars).isTwoFactorRequired).toBe(false);
    expect(adminAccessPolicyOf(wrangler.env.production.vars).isTwoFactorRequired).toBe(false);
  });

  it("stays required locally, where the two-factor journeys are tested", async () => {
    const wrangler = await readWrangler();
    expect(adminAccessPolicyOf(wrangler.vars).isTwoFactorRequired).toBe(true);
  });
});
