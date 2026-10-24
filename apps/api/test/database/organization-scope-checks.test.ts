import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyAllMigrations, startEmptyD1, type EmptyD1 } from "./empty-d1";
import {
  automaticIndexesOnGrowingTables,
  organizationTablesOf,
  tablesReadWithoutOrganizationFilter,
} from "./organization-scope";
import { explain } from "./query-plan";

describe("organization scope checks", () => {
  let d1: EmptyD1;
  let organizationTables: ReadonlySet<string>;

  const unfiltered = (sql: string) =>
    tablesReadWithoutOrganizationFilter({ sql, params: [] }, organizationTables);

  beforeAll(async () => {
    d1 = await startEmptyD1();
    await applyAllMigrations(d1.database);
    organizationTables = await organizationTablesOf(d1.database);
  });

  afterAll(async () => {
    await d1.dispose();
  });

  it("treats a table with an organization_id column as organization data", () => {
    expect(organizationTables.has("customers")).toBe(true);
    expect(organizationTables.has("prospect_companies")).toBe(false);
  });

  it("flags a read of organization data without organization_id filter", () => {
    expect(unfiltered('select "id" from "customers" where "customers"."id" = ?')).toEqual([
      "customers",
    ]);
  });

  it("accepts a read filtered by organization_id equality", () => {
    expect(
      unfiltered(
        'select "id" from "customers" where ("customers"."organization_id" = ? and "customers"."id" = ?)',
      ),
    ).toEqual([]);
  });

  it("accepts a read filtered by a list of organizations", () => {
    expect(
      unfiltered('select "id" from "members" where "members"."organization_id" in (?, ?)'),
    ).toEqual([]);
  });

  it("accepts a filter written on the table alias", () => {
    expect(
      unfiltered('select "m"."id" from "members" "m" where "m"."organization_id" = ?'),
    ).toEqual([]);
  });

  it("flags a joined table of organization data that is not filtered by organization_id", () => {
    expect(
      unfiltered(
        'select "sites"."id" from "customers" inner join "sites" on "sites"."customer_id" = "customers"."id" where "customers"."organization_id" = ?',
      ),
    ).toEqual(["sites"]);
  });

  it("does not take a join on organization_id for an organization filter", () => {
    expect(
      unfiltered(
        'select "members"."id" from "members" inner join "organizations" on "organizations"."id" = "members"."organization_id"',
      ),
    ).toEqual(["members"]);
  });

  it("flags an update and a delete of organization data without organization_id filter", () => {
    expect(unfiltered('update "sites" set "city" = ? where "sites"."id" = ?')).toEqual(["sites"]);
    expect(unfiltered('delete from "equipments" where "equipments"."id" = ?')).toEqual([
      "equipments",
    ]);
  });

  it("ignores an insert, which carries its organization_id in its values", () => {
    expect(unfiltered('insert into "customers" ("id", "organization_id") values (?, ?)')).toEqual(
      [],
    );
  });

  it("ignores tables that hold no organization data", () => {
    expect(
      unfiltered('select "id" from "prospect_companies" where "prospect_companies"."id" = ?'),
    ).toEqual([]);
  });

  it("flags a temporary index built on a table that grows when its index is missing", async () => {
    const scratch = await startEmptyD1();
    await applyAllMigrations(scratch.database);
    await scratch.database.prepare('drop index "members_user_id_idx"').run();

    const statement = await explain(scratch.database, {
      sql: 'select "users"."id", "members"."organization_id" from "users" left join "members" on "members"."user_id" = "users"."id"',
      params: [],
    });
    await scratch.dispose();

    expect(automaticIndexesOnGrowingTables(statement)).toEqual([
      expect.stringMatching(/^SEARCH members USING AUTOMATIC/),
    ]);
  });

  it("accepts a join that reaches the growing table through its own index", async () => {
    const statement = await explain(d1.database, {
      sql: 'select "users"."id", "members"."organization_id" from "users" left join "members" on "members"."user_id" = "users"."id"',
      params: [],
    });

    expect(statement.plan).toContainEqual(
      expect.stringMatching(/^SEARCH members USING INDEX members_user_id_idx/),
    );

    expect(automaticIndexesOnGrowingTables(statement)).toEqual([]);
  });
});
