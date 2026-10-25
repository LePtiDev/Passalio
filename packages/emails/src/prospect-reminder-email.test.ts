import { describe, expect, it } from "vitest";
import {
  parisClockTime,
  prospectReminderEmail,
  type ProspectReminderEmailInput,
} from "./prospect-reminder-email";

const ASSETS_URL = "https://app.passalio.com";
const COMPANY_URL = "https://app.passalio.com/admin/entreprises/entreprise-kh";

const reminder = (overrides: Partial<ProspectReminderEmailInput> = {}) =>
  prospectReminderEmail(
    {
      kind: "callback",
      notify: "minutes_15",
      dueAt: new Date("2026-11-05T16:30:00.000Z"),
      companyName: "KH Ramonage",
      companyCity: "Ivry-sur-Seine",
      contactName: "Karim Haddad",
      phone: "06 12 34 56 78",
      lastNote: {
        text: "En chantier toute la semaine.",
        at: new Date("2026-11-03T09:00:00.000Z"),
      },
      interest: "warm",
      teamSize: "two_to_three",
      toolKind: "paper",
      companyUrl: COMPANY_URL,
      ...overrides,
    },
    ASSETS_URL,
  );

describe("parisClockTime", () => {
  it("writes the Paris hour the French way, winter and summer", () => {
    expect(parisClockTime(new Date("2026-11-05T16:30:00.000Z"))).toBe("17 h 30");
    expect(parisClockTime(new Date("2026-07-01T07:05:00.000Z"))).toBe("9 h 05");
  });
});

describe("prospectReminderEmail", () => {
  it("follows the validated mockup: when, who, company, note, qualification", () => {
    const email = reminder();
    expect(email.subject).toBe("Rappel : Appeler Karim Haddad à 17 h 30");
    expect(email.text.split("\n").slice(0, 6)).toEqual([
      "Rappel dans 15 minutes",
      "Appeler Karim Haddad à 17 h 30",
      "KH Ramonage, Ivry-sur-Seine · 06 12 34 56 78",
      "",
      "Note du 3 novembre : « En chantier toute la semaine. »",
      "Qualifié tiède · 2 à 3 ramoneurs · gère sur papier",
    ]);
  });

  it("offers to call the number and to open the company file", () => {
    const email = reminder();
    expect(email.html).toContain('href="tel:0612345678"');
    expect(email.html).toContain(`href="${COMPANY_URL}"`);
    expect(email.text).toContain(COMPANY_URL);
  });

  it("names a demo and says it is time or tomorrow", () => {
    expect(reminder({ kind: "demo", notify: "at_time" }).text).toContain(
      "C'est l'heure\nDémo avec Karim Haddad à 17 h 30",
    );
    expect(reminder({ notify: "day_before" }).text).toContain("Rappel pour demain");
  });

  it("falls back to the company name and leaves out what is unknown", () => {
    const email = reminder({
      contactName: null,
      companyCity: null,
      phone: null,
      lastNote: null,
      interest: null,
      teamSize: null,
      toolKind: null,
    });
    expect(email.subject).toBe("Rappel : Appeler KH Ramonage à 17 h 30");
    expect(email.text).not.toContain("Note du");
    expect(email.text).not.toContain("Qualifié");
    expect(email.html).not.toContain("tel:");
    expect(email.text.split("\n").slice(0, 4)).toEqual([
      "Rappel dans 15 minutes",
      "Appeler KH Ramonage à 17 h 30",
      "KH Ramonage",
      "",
    ]);
  });

  it("escapes what the salesperson typed", () => {
    const email = reminder({ lastNote: { text: "<b>urgent</b>", at: new Date() } });
    expect(email.html).toContain("&lt;b&gt;urgent&lt;/b&gt;");
    expect(email.html).not.toContain("<b>urgent</b>");
  });
});
