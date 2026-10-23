import { describe, expect, it } from "vitest";
import {
  invitationEmail,
  magicLinkEmail,
  organizationInitials,
  passwordResetEmail,
  teamInvitationEmail,
} from "./transactional-emails";

const ASSETS_URL = "https://app.passalio.com";

describe("magicLinkEmail", () => {
  const email = magicLinkEmail(
    { url: "https://app.passalio.com/api/auth/magic-link/verify?token=abc&callbackURL=%2F" },
    ASSETS_URL,
  );

  it("puts the escaped link behind the button and the fallback link", () => {
    const href =
      'href="https://app.passalio.com/api/auth/magic-link/verify?token=abc&amp;callbackURL=%2F"';
    expect(email.html.split(href)).toHaveLength(3);
  });

  it("gives a plain text version with the raw link", () => {
    expect(email.text).toContain(
      "https://app.passalio.com/api/auth/magic-link/verify?token=abc&callbackURL=%2F",
    );
    expect(email.text).toContain("Valable 15 minutes.");
  });

  it("loads the logo and the icon from the app", () => {
    expect(email.html).toContain('src="https://app.passalio.com/email/passalio-logo-white.png"');
    expect(email.html).toContain('src="https://app.passalio.com/email/icon-key.png"');
    expect(email.subject).toBe("Votre lien de connexion");
  });
});

describe("passwordResetEmail", () => {
  it("states the one hour validity", () => {
    const email = passwordResetEmail({ url: "https://app.passalio.com/reset" }, ASSETS_URL);
    expect(email.subject).toBe("Choisissez un nouveau mot de passe");
    expect(email.html).toContain("Valable 1 heure");
    expect(email.html).toContain("icon-lock.png");
  });
});

describe("invitationEmail", () => {
  it("names the inviter in the subject and the company card", () => {
    const email = invitationEmail(
      {
        url: "https://app.passalio.com/invitations/org/inv",
        organizationName: "Ramonage Dupont",
        inviterName: "Jean Dupont",
      },
      ASSETS_URL,
    );
    expect(email.subject).toBe("Jean Dupont vous invite sur Passalio");
    expect(email.html).toContain(">RD<");
    expect(email.html).toContain("Jean Dupont vous invite<");
    expect(email.text.startsWith("Ramonage Dupont\nJean Dupont vous invite\n")).toBe(true);
  });

  it("falls back to the company name when the inviter is unknown", () => {
    const email = invitationEmail(
      { url: "https://app.passalio.com/i", organizationName: "Ramonage Dupont", inviterName: null },
      ASSETS_URL,
    );
    expect(email.subject).toBe("Rejoignez Ramonage Dupont sur Passalio");
    expect(email.html).not.toContain("vous invite<");
  });

  it("escapes names typed by users", () => {
    const email = invitationEmail(
      {
        url: "https://app.passalio.com/i",
        organizationName: "<script>alert(1)</script>",
        inviterName: 'Jean "Bob" <b>',
      },
      ASSETS_URL,
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<b>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});

describe("organizationInitials", () => {
  it.each([
    ["Ramonage Dupont", "RD"],
    ["éco ramonage du Val", "ÉR"],
    ["  SARL   Martin  ", "SM"],
    ["Ets. 3 Frères", "E3"],
    ["!!!", "P"],
  ])("turns %s into %s", (name, initials) => {
    expect(organizationInitials(name)).toBe(initials);
  });
});

describe("teamInvitationEmail", () => {
  it("names the inviter and the role", () => {
    const email = teamInvitationEmail(
      {
        url: "https://app.passalio.com/equipe-passalio/invitations/inv",
        inviterName: "Quentin",
        role: "sales",
      },
      ASSETS_URL,
    );
    expect(email.subject).toBe("Quentin vous invite dans l'équipe Passalio");
    expect(email.text).toContain("Vous rejoignez l'espace admin comme Commercial.");
    expect(email.html).toContain("Équipe Passalio");
    expect(email.text).toContain("https://app.passalio.com/equipe-passalio/invitations/inv");
  });
});
