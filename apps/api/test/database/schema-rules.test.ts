import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ARCHITECTURE_INDEXES,
  ORGANIZATION_DATA_TABLES,
  PASSALIO_TABLES,
  SYNCHRONIZED_TABLES,
  TABLES_WITHOUT_ORGANIZATION,
  type DocumentedIndex,
} from "./documented-schema";
import { applyAllMigrations, startEmptyD1, type EmptyD1 } from "./empty-d1";
import { schemaShapeOf, type TableShape } from "./schema-shape";

const sameColumns = (left: readonly (string | null)[], right: readonly string[]) =>
  left.length === right.length && left.every((column, position) => column === right[position]);

const shapeOf = (shapes: readonly TableShape[], table: string) =>
  shapes.find((shape) => shape.table === table);

const hasIndex = (shapes: readonly TableShape[], documented: DocumentedIndex) =>
  (shapeOf(shapes, documented.table)?.indexes ?? []).some(
    ({ columns, unique, partial }) =>
      sameColumns(columns, documented.columns) &&
      partial === 0 &&
      (unique === 1) === documented.isUnique,
  );

const columnOf = (shapes: readonly TableShape[], table: string, column: string) =>
  shapeOf(shapes, table)?.columns.find(({ name }) => name === column);

const sorted = (names: readonly string[]) =>
  names.toSorted((left, right) => left.localeCompare(right));

describe("schema rules of docs/ARCHITECTURE.md and docs/SECURITY.md", () => {
  let d1: EmptyD1;
  let shapes: readonly TableShape[];

  beforeAll(async () => {
    d1 = await startEmptyD1();
    await applyAllMigrations(d1.database);
    shapes = await schemaShapeOf(d1.database);
  });

  afterAll(async () => {
    await d1.dispose();
  });

  it("every table is classified as organization data or as a table without organization", () => {
    expect(sorted(shapes.map(({ table }) => table))).toEqual(
      sorted([...ORGANIZATION_DATA_TABLES, ...Object.keys(TABLES_WITHOUT_ORGANIZATION)]),
    );
  });

  it.each(ORGANIZATION_DATA_TABLES)(
    "%s holds a required organization_id, as every business table must",
    (table) => {
      expect(columnOf(shapes, table, "organization_id")).toMatchObject({ notnull: 1 });
    },
  );

  it.each(ORGANIZATION_DATA_TABLES)("%s has an index that starts with organization_id", (table) => {
    expect(
      shapeOf(shapes, table)?.indexes.some(({ columns }) => columns.at(0) === "organization_id"),
    ).toBe(true);
  });

  it.each(ORGANIZATION_DATA_TABLES)(
    "%s has the required id, created_at and updated_at columns",
    (table) => {
      expect({
        id: columnOf(shapes, table, "id")?.pk,
        createdAt: columnOf(shapes, table, "created_at")?.notnull,
        updatedAt: columnOf(shapes, table, "updated_at")?.notnull,
      }).toEqual({ id: 1, createdAt: 1, updatedAt: 1 });
    },
  );

  it.each(PASSALIO_TABLES)("%s holds no organization_id, as it is Passalio data", (table) => {
    expect(shapeOf(shapes, table)).toBeDefined();
    expect(columnOf(shapes, table, "organization_id")).toBeUndefined();
  });

  it.each(SYNCHRONIZED_TABLES)(
    "%s is synchronized: it has deleted_at and an (organization_id, updated_at) index",
    (table) => {
      expect(columnOf(shapes, table, "deleted_at")).toMatchObject({ notnull: 0 });
      expect(
        hasIndex(shapes, { table, columns: ["organization_id", "updated_at"], isUnique: false }),
      ).toBe(true);
    },
  );

  it("every table with organization_id and deleted_at is synchronized, so has its sync index", () => {
    const softDeletedOrganizationTables = shapes
      .filter(
        ({ columns }) =>
          columns.some(({ name }) => name === "organization_id") &&
          columns.some(({ name }) => name === "deleted_at"),
      )
      .map(({ table }) => table);

    expect(sorted(softDeletedOrganizationTables)).toEqual(sorted(SYNCHRONIZED_TABLES));
  });

  it("every index listed in docs/ARCHITECTURE.md exists on the tables already created", () => {
    const existing = new Set(shapes.map(({ table }) => table));
    const missing = ARCHITECTURE_INDEXES.filter(
      (documented) => existing.has(documented.table) && !hasIndex(shapes, documented),
    );

    expect(missing).toEqual([]);
  });
});
