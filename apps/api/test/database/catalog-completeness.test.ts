import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_DIRECTORY = join(import.meta.dirname, "../../src");
const REPOSITORIES_FILE = join(import.meta.dirname, "repositories.ts");

const COMPOSING_FACTORIES: Readonly<Record<string, string>> = {
  usageByOrganization: "subquery of the back office account read model, cataloged through it",
  createBackofficeDependencies: "only calls the cataloged read models",
  createCustomerDependencies: "only calls the cataloged repositories",
  createComplianceDependencies: "only calls the cataloged repositories",
  createSchedulingDependencies: "only calls the cataloged repositories",
  createIdentityDependencies: "only calls the cataloged repositories",
  createTeamDependencies: "only calls the cataloged repositories",
  createMailSettingsDependencies: "only calls the cataloged repositories",
  createReminderDependencies: "only calls the cataloged repositories",
  createPlatformSettingsDependencies: "only calls the cataloged repositories",
  createAuth: "Better Auth, cataloged through the session read of every request",
};

const EXPORT_TAKING_DATABASE = /export const (\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)/g;

const factoriesTakingDatabase = async () => {
  const files = await readdir(SOURCE_DIRECTORY, { recursive: true });
  const sources = await Promise.all(
    files
      .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
      .map((file) => readFile(join(SOURCE_DIRECTORY, file), "utf8")),
  );
  return sources
    .flatMap((content) => [...content.matchAll(EXPORT_TAKING_DATABASE)])
    .filter(([, , parameters]) => /:\s*Database\b|\bdatabase\b/.test(parameters ?? ""))
    .map(([, name]) => name ?? "")
    .toSorted((left, right) => left.localeCompare(right));
};

describe("completeness of the query catalog", () => {
  it("every exported function that receives the database is cataloged or composes cataloged ones", async () => {
    const repositories = await readFile(REPOSITORIES_FILE, "utf8");
    const factories = await factoriesTakingDatabase();

    expect(factories.length).toBeGreaterThan(0);
    expect(
      factories.filter(
        (name) => !repositories.includes(name) && !Object.hasOwn(COMPOSING_FACTORIES, name),
      ),
    ).toEqual([]);
  });

  it("every listed composing factory still exists", async () => {
    const factories = new Set(await factoriesTakingDatabase());

    expect(Object.keys(COMPOSING_FACTORIES).filter((name) => !factories.has(name))).toEqual([]);
  });
});
