import { describe, expect, it } from "vitest";
import { parseSearchWithoutForeignReturn } from "./parse-search";

describe("parseSearchWithoutForeignReturn", () => {
  it("keeps an internal return path", () => {
    expect(parseSearchWithoutForeignReturn("?retour=%2Fclients%2F42")).toEqual({
      retour: "/clients/42",
    });
  });

  it.each(["%2F%2Fevil.example", "https%3A%2F%2Fevil.example", "javascript%3Aalert(1)", ""])(
    "drops the return address %s and keeps the other parameters",
    (retour) => {
      expect(parseSearchWithoutForeignReturn(`?retour=${retour}&onglet=appareils`)).toEqual({
        onglet: "appareils",
      });
    },
  );

  it("leaves a search without return address untouched", () => {
    expect(parseSearchWithoutForeignReturn("?onglet=appareils")).toEqual({ onglet: "appareils" });
  });
});
