import { describe, expect, it } from "vitest";
import { teamFr } from "./team-fr";

describe("teamFr.roleDialog.title", () => {
  it("elides before a vowel or a mute h", () => {
    expect(teamFr.roleDialog.title("Antho")).toBe("Changer le rôle d'Antho");
    expect(teamFr.roleDialog.title("Élodie")).toBe("Changer le rôle d'Élodie");
    expect(teamFr.roleDialog.title("Hugo")).toBe("Changer le rôle d'Hugo");
  });

  it("keeps « de » before a consonant", () => {
    expect(teamFr.roleDialog.title("Quentin")).toBe("Changer le rôle de Quentin");
  });
});
