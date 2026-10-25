import { describe, expect, it } from "vitest";
import { mailboxTestEmail, mailSettingsChangedEmail } from "./mail-settings-emails";

const ASSETS_URL = "https://app.passalio.com";
const URL = "https://app.passalio.com/admin/configuration";
const AT = new Date("2026-10-24T21:50:00.000Z");

describe("mailSettingsChangedEmail", () => {
  const email = mailSettingsChangedEmail(
    { editorName: "Quentin", fields: ["smtpPassword", "smtpHost"], at: AT, url: URL },
    ASSETS_URL,
  );

  it("names who changed the settings and what changed, in French", () => {
    expect(email.subject).toBe("Quentin a modifié votre configuration mail");
    expect(email.text).toContain("Quentin a modifié : mot de passe de boîte, serveur d'envoi.");
  });

  it("dates the change in Paris time and links to the configuration", () => {
    expect(email.text).toContain("Le 24 octobre à 23:50.");
    expect(email.text).toContain(URL);
    expect(email.html).toContain(`href="${URL}"`);
  });
});

describe("mailboxTestEmail", () => {
  it("confirms the mailbox works and says when it was sent", () => {
    const email = mailboxTestEmail({ at: AT, url: "https://app.passalio.com" }, ASSETS_URL);
    expect(email.subject).toBe("Test de votre boîte mail Passalio");
    expect(email.text).toContain("Passalio peut envoyer vos mails depuis cette boîte.");
    expect(email.text).toContain("Envoyé le 24 octobre à 23:50.");
  });
});
