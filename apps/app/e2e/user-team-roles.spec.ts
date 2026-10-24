import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousAccessibilityViolations } from "./support/accessibility";
import { signUpAndOnboardOwner, uniqueEmail } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import {
  FAKE_SHORT_TRACE_ID,
  SHORT_TRACE_CODE,
  failWithServerError,
  holdResponses,
} from "./support/server-responses";
import {
  inviteFromTeamScreen,
  joinTeam,
  openPendingInvitations,
  openTeamScreen,
} from "./support/team";
import { MIN_TOUCH_TARGET_PX } from "./support/touch-targets";
import { MOBILE, VIEWPORTS } from "./support/viewports";

const MEMBERS_ROUTE = (url: URL) => url.pathname === "/api/members";

const MEMBER_ROUTE = (url: URL) => url.pathname.startsWith("/api/members/");

const INVITATIONS_ROUTE = (url: URL) => url.pathname === "/api/invitations";

const ASSIGNABLE_ROLES = ["Administrateur", "Secrétariat", "Technicien"];

const memberRow = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ hasText: name });

const toastWith = (page: Page, message: string) =>
  page.getByRole("listitem").filter({ hasText: message });

const busyList = (page: Page) => page.getByRole("list").and(page.locator("[aria-busy='true']"));

const openInviteDialog = async (page: Page) => {
  await page.getByRole("button", { name: "Inviter une personne" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Inviter une personne" });
  await expect(dialog).toBeVisible();
  return dialog;
};

const ERROR_STATE_TIMEOUT_MS = 20_000;

for (const viewport of VIEWPORTS) {
  test.describe(`team roles and states on ${viewport.name}`, () => {
    test.use({ viewport: viewport.size });

    test.beforeEach(async ({ context }) => {
      await assignClientIp(context);
    });

    test("an administrator manages members but can neither transfer the ownership nor touch the owner", async ({
      page,
      browser,
    }) => {
      const owner = await signUpAndOnboardOwner(page, {
        account: { firstName: "Yves" },
        companyName: "Ramonage Noël",
      });
      const ownerName = `${owner.firstName} ${owner.lastName}`;
      await openTeamScreen(page);
      const adminEmail = uniqueEmail("admin");
      const adminLink = await inviteFromTeamScreen(page, adminEmail, "Administrateur");
      const technicianEmail = uniqueEmail("technicien");
      const technicianLink = await inviteFromTeamScreen(page, technicianEmail);
      const technician = await joinTeam(browser, technicianLink, {
        viewport: viewport.size,
        account: { firstName: "Tom", lastName: "Roux", email: technicianEmail },
      });
      await technician.context.close();
      const admin = await joinTeam(browser, adminLink, {
        viewport: viewport.size,
        account: { firstName: "Agathe", lastName: "Blanc", email: adminEmail },
      });

      const screen = admin.page;
      await expect(memberRow(screen, "Tom Roux")).toBeVisible();
      await expect(
        screen.getByRole("button", { name: "Inviter une personne" }).first(),
      ).toBeVisible();
      await expect(
        memberRow(screen, ownerName).getByText("Propriétaire", { exact: true }),
      ).toBeVisible();
      await expect(screen.getByRole("button", { name: `Rôle de ${ownerName}` })).toHaveCount(0);
      await expect(screen.getByRole("button", { name: `Actions pour ${ownerName}` })).toHaveCount(
        0,
      );
      await expect(screen.getByRole("button", { name: "Rôle de Agathe Blanc" })).toHaveCount(0);
      await expect(screen.getByRole("button", { name: "Actions pour Agathe Blanc" })).toHaveCount(
        0,
      );

      await screen.getByRole("button", { name: "Actions pour Tom Roux" }).click();
      await expect(screen.getByRole("menuitem", { name: "Retirer de l'équipe" })).toBeVisible();
      await expect(screen.getByRole("menuitem", { name: "Transférer la propriété" })).toHaveCount(
        0,
      );
      await screen.keyboard.press("Escape");
      await expect(screen.getByRole("menuitem", { name: "Retirer de l'équipe" })).toHaveCount(0);

      await screen.getByRole("button", { name: "Rôle de Tom Roux" }).click();
      await screen.getByRole("menuitemradio", { name: "Secrétariat" }).click();
      await expect(toastWith(screen, "Tom Roux est maintenant secrétariat.")).toBeVisible();

      await page.reload();
      await expect(page.getByRole("button", { name: "Rôle de Tom Roux" })).toHaveText(
        /Secrétariat/,
      );
      await admin.context.close();
    });

    test("a secretary sees neither the invite button nor the role and member actions", async ({
      page,
      browser,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { companyName: "Ramonage Olivier" });
      await openTeamScreen(page);
      const secretaryEmail = uniqueEmail("secretariat");
      const link = await inviteFromTeamScreen(page, secretaryEmail, "Secrétariat");
      const pendingEmail = uniqueEmail("attente");
      await inviteFromTeamScreen(page, pendingEmail);
      const secretary = await joinTeam(browser, link, {
        viewport: viewport.size,
        account: { firstName: "Zoé", lastName: "Petit", email: secretaryEmail },
      });

      const screen = secretary.page;
      await expect(screen.getByRole("main").getByText(owner.email)).toBeVisible();
      await expect(
        memberRow(screen, "Zoé Petit").getByText("Secrétariat", { exact: true }),
      ).toBeVisible();
      await expect(screen.getByRole("button", { name: "Inviter une personne" })).toHaveCount(0);
      await expect(screen.getByRole("button", { name: /^Rôle de / })).toHaveCount(0);
      await expect(screen.getByRole("button", { name: /^Actions pour / })).toHaveCount(0);

      await openPendingInvitations(screen);
      await expect(screen.getByText(pendingEmail, { exact: true })).toBeVisible();
      await expect(screen.getByRole("button", { name: "Renvoyer" })).toHaveCount(0);
      await expect(screen.getByRole("button", { name: /^Annuler l'invitation/ })).toHaveCount(0);
      await secretary.context.close();
    });

    test("the owner role is never offered, neither in the invite dialog nor in the role menu", async ({
      page,
      browser,
    }) => {
      const owner = await signUpAndOnboardOwner(page, {
        account: { firstName: "Bastien" },
        companyName: "Ramonage Robin",
      });
      const ownerName = `${owner.firstName} ${owner.lastName}`;
      await openTeamScreen(page);

      const dialog = await openInviteDialog(page);
      await dialog.getByRole("combobox", { name: "Rôle" }).click();
      await expect(page.getByRole("option")).toHaveText(ASSIGNABLE_ROLES);
      await page.getByRole("option", { name: "Technicien" }).click();
      await dialog.getByRole("button", { name: "Annuler" }).click();
      await expect(dialog).toBeHidden();

      const memberEmail = uniqueEmail("membre");
      const link = await inviteFromTeamScreen(page, memberEmail);
      const member = await joinTeam(browser, link, {
        viewport: viewport.size,
        account: { firstName: "Hélène", lastName: "Faure", email: memberEmail },
      });
      await member.context.close();

      await page.reload();
      await expect(page.getByRole("button", { name: "Rôle de Hélène Faure" })).toBeVisible();
      await expect(page.getByRole("button", { name: `Rôle de ${ownerName}` })).toHaveCount(0);
      await expect(page.getByRole("button", { name: `Actions pour ${ownerName}` })).toHaveCount(0);
      await page.getByRole("button", { name: "Rôle de Hélène Faure" }).click();
      await expect(page.getByRole("menuitemradio")).toHaveText(ASSIGNABLE_ROLES);
      await expect(page.getByRole("menuitemradio", { name: "Technicien" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    test("inviting a person who is already a member is refused with a trace code and keeps the dialog open", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { companyName: "Ramonage Picard" });
      await openTeamScreen(page);

      const dialog = await openInviteDialog(page);
      await dialog.getByLabel("Adresse email").fill(owner.email);
      const response = page.waitForResponse(
        (candidate) =>
          candidate.url().endsWith("/api/invitations") && candidate.request().method() === "POST",
      );
      await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();
      expect((await response).status()).toBe(409);

      const toast = toastWith(page, "Cette personne fait déjà partie de l'équipe.");
      await expect(toast).toBeVisible();
      await expect(toast.getByText(SHORT_TRACE_CODE)).toBeVisible();
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel("Adresse email")).toHaveValue(owner.email);
      await expect(dialog.getByRole("button", { name: "Envoyer l'invitation" })).toBeEnabled();
    });

    test("an invalid address is refused in the invite dialog without calling the server", async ({
      page,
    }) => {
      await signUpAndOnboardOwner(page, { companyName: "Ramonage Lefèvre" });
      await openTeamScreen(page);
      const invitationRequests: string[] = [];
      page.on("request", (request) => {
        if (request.url().endsWith("/api/invitations") && request.method() === "POST") {
          invitationRequests.push(request.url());
        }
      });

      const dialog = await openInviteDialog(page);
      await dialog.getByLabel("Adresse email").fill("pas-une-adresse");
      await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();

      await expect(dialog.getByText("Saisissez une adresse email valide.")).toBeVisible();
      await expect(dialog.getByLabel("Adresse email")).toHaveAttribute("aria-invalid", "true");
      await expectNoSeriousAccessibilityViolations(page, { include: "[role='dialog']" });
      expect(invitationRequests).toEqual([]);
    });

    test("the team screen shows a skeleton of the member list while it loads", async ({ page }) => {
      const owner = await signUpAndOnboardOwner(page, { companyName: "Ramonage Moreau" });
      const release = await holdResponses(page, MEMBERS_ROUTE, "GET");

      await page.goto("/equipe");
      await expect(page.getByRole("heading", { name: "Équipe" })).toBeVisible();
      await expect(busyList(page)).toBeVisible();
      await expect(page.getByRole("main").getByText(owner.email)).toHaveCount(0);

      release();
      await expect(page.getByRole("main").getByText(owner.email)).toBeVisible();
      await expect(busyList(page)).toHaveCount(0);
    });

    test("the team screen shows the loading error with its trace code and recovers on retry", async ({
      page,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { companyName: "Ramonage Mercier" });
      const restore = await failWithServerError(page, MEMBERS_ROUTE, "GET");

      await page.goto("/equipe");
      await expect(page.getByRole("heading", { name: "Équipe" })).toBeVisible();
      const alert = page.getByRole("main").getByRole("alert");
      await expect(alert).toBeVisible({ timeout: ERROR_STATE_TIMEOUT_MS });
      await expect(alert).toContainText("Une erreur est survenue. Réessayez dans un instant.");
      await expect(alert.getByText(`Code : ${FAKE_SHORT_TRACE_ID}`)).toBeVisible();
      await expectNoSeriousAccessibilityViolations(page, { include: "main" });

      await restore();
      await alert.getByRole("button", { name: "Réessayer" }).click();
      await expect(page.getByRole("main").getByText(owner.email)).toBeVisible();
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    });

    test("a refused role change shows its trace code and keeps the previous role", async ({
      page,
      browser,
    }) => {
      await signUpAndOnboardOwner(page, { companyName: "Ramonage Gauthier" });
      await openTeamScreen(page);
      const memberEmail = uniqueEmail("membre");
      const link = await inviteFromTeamScreen(page, memberEmail);
      const member = await joinTeam(browser, link, {
        viewport: viewport.size,
        account: { firstName: "Louis", lastName: "Masson", email: memberEmail },
      });
      await member.context.close();

      await page.reload();
      const roleButton = page.getByRole("button", { name: "Rôle de Louis Masson" });
      await expect(roleButton).toHaveText(/Technicien/);
      await failWithServerError(page, MEMBER_ROUTE, "PATCH");
      await roleButton.click();
      await page.getByRole("menuitemradio", { name: "Administrateur" }).click();

      const toast = toastWith(page, "Une erreur est survenue. Réessayez dans un instant.");
      await expect(toast).toBeVisible();
      await expect(toast.getByText(`Code : ${FAKE_SHORT_TRACE_ID}`)).toBeVisible();
      await expect(toastWith(page, "Louis Masson est maintenant administrateur.")).toHaveCount(0);
      await expect(roleButton).toHaveText(/Technicien/);
      await expect(roleButton).toBeEnabled();
    });

    test("a removed member no longer sees the team and gets an error with its trace code", async ({
      page,
      browser,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { companyName: "Ramonage Chevalier" });
      await openTeamScreen(page);
      const memberEmail = uniqueEmail("membre");
      const link = await inviteFromTeamScreen(page, memberEmail);
      const member = await joinTeam(browser, link, {
        viewport: viewport.size,
        account: { firstName: "Nina", lastName: "Brun", email: memberEmail },
      });
      await expect(member.page.getByRole("main").getByText(owner.email)).toBeVisible();

      await page.reload();
      await page.getByRole("button", { name: "Actions pour Nina Brun" }).click();
      await page.getByRole("menuitem", { name: "Retirer de l'équipe" }).click();
      await page
        .getByRole("alertdialog", { name: "Retirer Nina Brun de l'équipe ?" })
        .getByRole("button", { name: "Retirer" })
        .click();
      await expect(toastWith(page, "Nina Brun a été retiré de l'équipe.")).toBeVisible();

      const refused = member.page.waitForResponse(
        (response) => response.url().includes("/api/members?") && !response.ok(),
      );
      await member.page.goto("/equipe");
      expect((await refused).status()).toBe(403);
      const alert = member.page.getByRole("main").getByRole("alert");
      await expect(alert).toBeVisible({ timeout: ERROR_STATE_TIMEOUT_MS });
      await expect(alert.getByRole("button", { name: "Réessayer" })).toBeVisible();
      await expect(alert.getByText(SHORT_TRACE_CODE)).toBeVisible();
      await expect(member.page.getByRole("main").getByText(owner.email)).toHaveCount(0);
      await member.context.close();
    });

    test("the empty pending invitations tab offers to invite a person", async ({ page }) => {
      await signUpAndOnboardOwner(page, { companyName: "Ramonage Dumas" });
      await openTeamScreen(page);
      await expect(page.getByText("Vous êtes seul pour l'instant")).toBeVisible();

      await openPendingInvitations(page);
      const panel = page.getByRole("tabpanel");
      await expect(panel.getByText("Aucune invitation en attente")).toBeVisible();
      await panel.getByRole("button", { name: "Inviter une personne" }).click();
      await expect(page.getByRole("dialog", { name: "Inviter une personne" })).toBeVisible();
    });

    test("the invite button shows the invitation is being sent until the server answers", async ({
      page,
    }) => {
      await signUpAndOnboardOwner(page, { companyName: "Ramonage Barbier" });
      await openTeamScreen(page);
      const release = await holdResponses(page, INVITATIONS_ROUTE, "POST");
      const invitedEmail = uniqueEmail("envoi");

      const dialog = await openInviteDialog(page);
      await dialog.getByLabel("Adresse email").fill(invitedEmail);
      await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();
      const sending = dialog.getByRole("button", { name: "Envoi…" });
      await expect(sending).toBeVisible();
      await expect(sending).toBeDisabled();

      release();
      await expect(
        toastWith(page, `Invitation envoyée à ${invitedEmail}. Elle est valable 7 jours.`),
      ).toBeVisible();
      await expect(dialog).toBeHidden();
    });
  });
}

test.describe("team error state on mobile", () => {
  test.use({ viewport: MOBILE });

  test.beforeEach(async ({ context }) => {
    await assignClientIp(context);
  });

  test("the retry button of the team loading error is at least 48 px high", async ({ page }) => {
    await signUpAndOnboardOwner(page, { companyName: "Ramonage Renaud" });
    await failWithServerError(page, MEMBERS_ROUTE, "GET");

    await page.goto("/equipe");
    await expect(page.getByRole("heading", { name: "Équipe" })).toBeVisible();
    const retry = page
      .getByRole("main")
      .getByRole("alert")
      .getByRole("button", { name: "Réessayer" });
    await expect(retry).toBeVisible({ timeout: ERROR_STATE_TIMEOUT_MS });
    const box = await retry.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
  });
});
