import { describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { DECLARED_ROUTES, MEMBER_ROUTES, routeKey, SESSION_ROUTES } from "./route-declarations";
import { SAMPLED_ROUTE_KEYS } from "./route-samples";

const sorted = (values: Iterable<string>) =>
  [...new Set(values)].toSorted((left, right) => left.localeCompare(right));

const registeredKeys = sorted(app.routes.map(routeKey));
const declaredKeys = DECLARED_ROUTES.map(routeKey);

const hasPathParameter = (path: string) => path.includes("/:");

describe("route inventory", () => {
  it("declares every route registered on the Hono app, and no route that does not exist", () => {
    expect(sorted(declaredKeys)).toEqual(registeredKeys);
  });

  it("declares each route only once", () => {
    expect(declaredKeys).toHaveLength(new Set(declaredKeys).size);
  });

  it.each(registeredKeys)("%s is declared in the matrices", (key) => {
    expect(declaredKeys).toContain(key);
  });

  it("gives a sample request to every route that needs a session, and to no other", () => {
    expect(sorted(SAMPLED_ROUTE_KEYS)).toEqual(sorted(SESSION_ROUTES.map(routeKey)));
  });

  it.each(MEMBER_ROUTES.filter(({ path }) => hasPathParameter(path)))(
    "$method $path declares how it answers for another organization's resource",
    ({ foreignResourceStatus }) => {
      expect([403, 404]).toContain(foreignResourceStatus);
    },
  );
});
