import { describe, expect, it } from "vitest";
import { returnToSearch } from "../routes/return-to-search";

const isAccepted = (retour: string) => returnToSearch.safeParse({ retour }).success;

describe("retour parameter", () => {
  it.each(["/", "/clients", "/clients/42?onglet=appareils", "/admin/equipe#membres"])(
    "accepts the internal path %s",
    (retour) => {
      expect(isAccepted(retour)).toBe(true);
    },
  );

  it.each([
    "//evil.example",
    "//evil.example/clients",
    "https://evil.example",
    "http://evil.example/connexion",
    "javascript:alert(1)",
    "clients",
    "evil.example",
    "",
  ])("refuses %s, which is not an internal path", (retour) => {
    expect(isAccepted(retour)).toBe(false);
  });

  it("lets the parameter be absent", () => {
    expect(returnToSearch.parse({})).toEqual({});
  });
});
