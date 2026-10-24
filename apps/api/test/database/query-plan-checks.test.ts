import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyAllMigrations, startEmptyD1, type EmptyD1 } from "./empty-d1";
import {
  explain,
  fullScansOfGrowingTables,
  organizationFilteredTables,
  stepsNotUsingOrganizationIndex,
  wholeIndexReadsOfGrowingTables,
} from "./query-plan";

const ORGANIZATION_ID = "0192f3a4-0000-7000-8000-000000000001";

describe("query plan checks", () => {
  let d1: EmptyD1;

  const explained = (sql: string, params: readonly unknown[]) =>
    explain(d1.database, { sql, params });

  beforeAll(async () => {
    d1 = await startEmptyD1();
    await applyAllMigrations(d1.database);
  });

  afterAll(async () => {
    await d1.dispose();
  });

  it("flags a full scan of a table that grows", async () => {
    const statement = await explained(
      'select "id" from "customers" where "customers"."email" = ?',
      ["camille.lefevre@exemple.fr"],
    );

    expect(fullScansOfGrowingTables(statement)).toEqual(["SCAN customers"]);
  });

  it("ignores a full scan of a table that does not grow", async () => {
    const statement = await explained(
      'select "id" from "rate_limits" where "rate_limits"."count" > ?',
      [10],
    );

    expect(statement.plan).toEqual(["SCAN rate_limits"]);
    expect(fullScansOfGrowingTables(statement)).toEqual([]);
  });

  it("resolves a table alias before looking for full scans", async () => {
    const statement = await explained(
      'select "signed_in"."id" from "sessions" "signed_in" where "signed_in"."ip_address" = ?',
      ["10.0.0.1"],
    );

    expect(fullScansOfGrowingTables(statement)).toEqual(["SCAN signed_in"]);
  });

  it("finds the tables a statement filters by organization", () => {
    expect(
      organizationFilteredTables({
        sql: 'update "sites" set "city" = ? where "sites"."organization_id" = ? and "sites"."customer_id" in (select "id" from "customers" where "customers"."organization_id" = ?)',
        params: [],
      }),
    ).toEqual(["sites", "customers"]);
  });

  it("accepts organization data read through an index that starts with organization_id", async () => {
    const statement = await explained(
      'select "id" from "sites" where "sites"."organization_id" = ? and "sites"."customer_id" = ?',
      [ORGANIZATION_ID, "customer"],
    );

    expect(await stepsNotUsingOrganizationIndex(d1.database, statement)).toEqual([]);
  });

  it("accepts a single row read by primary key inside an organization", async () => {
    const statement = await explained(
      'select "id" from "customers" where "customers"."organization_id" = ? and "customers"."id" = ?',
      [ORGANIZATION_ID, "customer"],
    );

    expect(await stepsNotUsingOrganizationIndex(d1.database, statement)).toEqual([]);
  });

  it("flags organization data read through an index that does not start with organization_id", async () => {
    const statement = await explained(
      'select "id" from "invitations" indexed by "invitations_email_idx" where "invitations"."organization_id" = ? and "invitations"."email" = ?',
      [ORGANIZATION_ID, "hugo.bernard@exemple.fr"],
    );

    expect(await stepsNotUsingOrganizationIndex(d1.database, statement)).toEqual([
      "SEARCH invitations USING INDEX invitations_email_idx (email=?)",
    ]);
  });

  it("flags organization data read by a full scan", async () => {
    const statement = await explained(
      'select "id" from "equipments" where "equipments"."organization_id" = ? or "equipments"."room" = ?',
      [ORGANIZATION_ID, "Cuisine"],
    );

    expect(await stepsNotUsingOrganizationIndex(d1.database, statement)).toEqual([
      "SCAN equipments",
    ]);
  });

  it("flags a whole index read of a table that grows", async () => {
    const statement = await explained('select count(*) from "members"', []);

    expect(wholeIndexReadsOfGrowingTables(statement)).toHaveLength(1);
  });

  it("accepts a page read in index order", async () => {
    const statement = await explained(
      'select "id" from "prospect_companies" order by "prospect_companies"."search_name" asc limit ?',
      [20],
    );

    expect(statement.plan.at(0)).toMatch(/^SCAN prospect_companies USING INDEX/);
    expect(wholeIndexReadsOfGrowingTables(statement)).toEqual([]);
  });
});
