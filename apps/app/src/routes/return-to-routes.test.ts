import { describe, expect, it } from "vitest";
import { adminCodeRoute } from "./admin-security";
import { returnToSearch } from "./return-to-search";
import { signInRoute } from "./sign-in";
import { signInCodeRoute } from "./sign-in-code";
import { signUpRoute } from "./sign-up";

const ROUTES_READING_RETURN_TO = [
  ["sign-in", signInRoute],
  ["sign-up", signUpRoute],
  ["sign-in code", signInCodeRoute],
  ["admin code", adminCodeRoute],
] as const;

describe("routes that send the person back to retour", () => {
  it.each(ROUTES_READING_RETURN_TO)(
    "the %s route checks retour with the internal path rule",
    (_name, route) => {
      expect(route.options.validateSearch).toBe(returnToSearch);
    },
  );
});
