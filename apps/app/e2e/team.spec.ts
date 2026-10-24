import { expect, test, type Page } from "@playwright/test";
import { newAccount, signUpAndOnboardOwner, uniqueEmail } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import { emailLinkSentBy } from "./support/email-links";
import {
  acceptInvitation,
  inviteFromTeamScreen,
  joinTeam,
  openPendingInvitations,
  openTeamScreen,
  signUpFromInvitation,
} from "./support/team";
import { VIEWPORTS } from "./support/viewports";

const SHORT_TRACE_ID = /^Code : [0-9a-f]{8}$/;

const memberRow = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ hasText: name });

const expectShortTraceId = async (page: Page) => {
  await expect(page.getByText(SHORT_TRACE_ID)).toBeVisible();
};

for (const viewport of VIEWPORTS) {
  test.describe(`team on ${viewport.name}`, () => {
    test.use({ viewport: viewport.size });

    test.beforeEach(async ({ context }) => {
      await assignClientIp(context);
    });

    test("an invitation accepted by someone signed in with another address is refused", async ({
      page,
      browser,
    }) => {
      await signUpAndOnboardOwner(page, { companyName: "Ramonage Bernard" });
      await openTeamScreen(page);
      const invitedEmail = uniqueEmail("invite");
      const link = await inviteFromTeamScreen(page, invitedEmail);

      const strangerContext = await browser.newContext({ viewport: viewport.size });
      await assignClientIp(strangerContext);
      const stranger = await strangerContext.newPage();
      await signUpFromInvitation(stranger, link, newAccount({ email: uniqueEmail("autre") }));
      await stranger.getByRole("button", { name: "Accepter l'invitation" }).click();

      await expect(
        stranger.getByText(
          "Cette invitation a été envoyée à une autre adresse. Connectez-vous avec celle-ci.",
        ),
      ).toBeVisible();
      await expectShortTraceId(stranger);
      await expect(stranger).toHaveURL(/\/invitations\//);
      await expect(stranger.getByRole("heading", { name: "Rejoindre l'équipe" })).toBeVisible();

      await page.reload();
      await expect(page.getByRole("heading", { name: "Équipe" })).toBeVisible();
      await openPendingInvitations(page);
      await expect(page.getByText(invitedEmail, { exact: true })).toBeVisible();
      await strangerContext.close();
    });

    test("an owner resends an invitation, then cancels it and its link stops working", async ({
      page,
      browser,
    }) => {
      await signUpAndOnboardOwner(page, { companyName: "Ramonage Caron" });
      await openTeamScreen(page);
      const invitedEmail = uniqueEmail("renvoi");
      const firstLink = await inviteFromTeamScreen(page, invitedEmail, "Secrétariat");

      await openPendingInvitations(page);
      await expect(page.getByText(invitedEmail, { exact: true })).toBeVisible();
      await expect(
        page.getByText(/Secrétariat · envoyée le .*, expire dans 7 jours/),
      ).toBeVisible();

      const resentLink = await emailLinkSentBy("invitation", async () => {
        await page.getByRole("button", { name: "Renvoyer" }).click();
        await expect(
          page.getByText(`Invitation renvoyée à ${invitedEmail}. Elle est valable 7 jours.`),
        ).toBeVisible();
      });
      expect(resentLink).toBe(firstLink);

      await page.getByRole("button", { name: `Annuler l'invitation ${invitedEmail}` }).click();
      await expect(page.getByText(`Invitation de ${invitedEmail} annulée.`)).toBeVisible();
      await expect(page.getByText("Aucune invitation en attente")).toBeVisible();
      await expect(page.getByText(invitedEmail, { exact: true })).toHaveCount(0);

      const invitedContext = await browser.newContext({ viewport: viewport.size });
      await assignClientIp(invitedContext);
      const invited = await invitedContext.newPage();
      await signUpFromInvitation(invited, resentLink, newAccount({ email: invitedEmail }));
      await invited.getByRole("button", { name: "Accepter l'invitation" }).click();
      await expect(
        invited.getByText("Cette invitation n'existe plus ou a déjà été utilisée."),
      ).toBeVisible();
      await expectShortTraceId(invited);
      await expect(invited).toHaveURL(/\/invitations\//);
      await invitedContext.close();
    });

    test("an owner changes the role of a member, then removes the member from the team", async ({
      page,
      browser,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { companyName: "Ramonage Durand" });
      await openTeamScreen(page);
      const memberEmail = uniqueEmail("membre");
      const link = await inviteFromTeamScreen(page, memberEmail);
      const member = await joinTeam(browser, link, {
        viewport: viewport.size,
        account: { firstName: "Marc", lastName: "Leroy", email: memberEmail },
      });

      await page.reload();
      await expect(page.getByRole("button", { name: "Rôle de Marc Leroy" })).toHaveText(
        /Technicien/,
      );
      await page.getByRole("button", { name: "Rôle de Marc Leroy" }).click();
      await page.getByRole("menuitemradio", { name: "Secrétariat" }).click();
      await expect(page.getByText("Marc Leroy est maintenant secrétariat.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Rôle de Marc Leroy" })).toHaveText(
        /Secrétariat/,
      );

      await page.reload();
      await expect(page.getByRole("button", { name: "Rôle de Marc Leroy" })).toHaveText(
        /Secrétariat/,
      );

      await page.getByRole("button", { name: "Actions pour Marc Leroy" }).click();
      await expect(page.getByRole("menuitem", { name: "Transférer la propriété" })).toHaveCount(0);
      await page.getByRole("menuitem", { name: "Retirer de l'équipe" }).click();
      const confirmation = page.getByRole("alertdialog", {
        name: "Retirer Marc Leroy de l'équipe ?",
      });
      await expect(confirmation).toBeVisible();
      await confirmation.getByRole("button", { name: "Retirer" }).click();
      await expect(page.getByText("Marc Leroy a été retiré de l'équipe.")).toBeVisible();
      await expect(memberRow(page, "Marc Leroy")).toHaveCount(0);
      await expect(page.getByText("Vous êtes seul pour l'instant")).toBeVisible();

      await member.page.goto("/equipe");
      await expect(member.page.getByText(owner.email)).toHaveCount(0);
      await member.context.close();
    });

    test("an owner transfers the ownership to an administrator and becomes administrator", async ({
      page,
      browser,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { companyName: "Ramonage Fabre" });
      await openTeamScreen(page);
      const adminEmail = uniqueEmail("admin");
      const link = await inviteFromTeamScreen(page, adminEmail, "Administrateur");
      const admin = await joinTeam(browser, link, {
        viewport: viewport.size,
        account: { firstName: "Sophie", lastName: "Garnier", email: adminEmail },
      });

      await page.reload();
      await expect(page.getByRole("button", { name: "Rôle de Sophie Garnier" })).toHaveText(
        /Administrateur/,
      );
      await page.getByRole("button", { name: "Actions pour Sophie Garnier" }).click();
      await page.getByRole("menuitem", { name: "Transférer la propriété" }).click();
      const confirmation = page.getByRole("alertdialog", {
        name: "Transférer la propriété à Sophie Garnier ?",
      });
      await expect(confirmation).toBeVisible();
      await confirmation.getByRole("button", { name: "Transférer" }).click();
      await expect(page.getByText("Sophie Garnier est maintenant propriétaire.")).toBeVisible();

      const newOwnerRow = memberRow(page, "Sophie Garnier");
      await expect(newOwnerRow.getByText("Propriétaire", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Rôle de Sophie Garnier" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Actions pour Sophie Garnier" })).toHaveCount(
        0,
      );
      const formerOwnerRow = memberRow(page, owner.email);
      await expect(formerOwnerRow.getByText("Administrateur", { exact: true })).toBeVisible();

      await admin.page.reload();
      await expect(admin.page.getByRole("heading", { name: "Équipe" })).toBeVisible();
      await expect(
        memberRow(admin.page, "Sophie Garnier").getByText("Propriétaire", { exact: true }),
      ).toBeVisible();
      await expect(
        admin.page.getByRole("button", { name: `Rôle de ${owner.firstName} Dupont` }),
      ).toHaveText(/Administrateur/);
      await admin.context.close();
    });

    test("a technician sees neither the invite button nor the role and member actions", async ({
      page,
      browser,
    }) => {
      const owner = await signUpAndOnboardOwner(page, { companyName: "Ramonage Girard" });
      await openTeamScreen(page);
      const technicianEmail = uniqueEmail("technicien");
      const link = await inviteFromTeamScreen(page, technicianEmail);
      const pendingEmail = uniqueEmail("attente");
      await inviteFromTeamScreen(page, pendingEmail, "Secrétariat");
      const technician = await joinTeam(browser, link, {
        viewport: viewport.size,
        account: { firstName: "Paul", lastName: "Henry", email: technicianEmail },
      });

      const screen = technician.page;
      await expect(screen.getByRole("main").getByText(owner.email)).toBeVisible();
      await expect(screen.getByRole("button", { name: "Inviter une personne" })).toHaveCount(0);
      await expect(screen.getByRole("button", { name: /^Rôle de / })).toHaveCount(0);
      await expect(screen.getByRole("button", { name: /^Actions pour / })).toHaveCount(0);
      await expect(
        memberRow(screen, "Paul Henry").getByText("Technicien", { exact: true }),
      ).toBeVisible();

      await openPendingInvitations(screen);
      await expect(screen.getByText(pendingEmail, { exact: true })).toBeVisible();
      await expect(screen.getByRole("button", { name: "Renvoyer" })).toHaveCount(0);
      await expect(screen.getByRole("button", { name: /^Annuler l'invitation/ })).toHaveCount(0);
      await technician.context.close();
    });

    test("an owner of one company who accepts an invitation from another joins it", async ({
      page,
      browser,
    }) => {
      await signUpAndOnboardOwner(page, { companyName: "Ramonage Lambert" });
      await openTeamScreen(page);

      const otherOwnerContext = await browser.newContext({ viewport: viewport.size });
      await assignClientIp(otherOwnerContext);
      const otherOwnerPage = await otherOwnerContext.newPage();
      const otherOwner = await signUpAndOnboardOwner(otherOwnerPage, {
        account: { firstName: "Rémi" },
        companyName: "Fumisterie Martin",
      });

      const link = await inviteFromTeamScreen(page, otherOwner.email);
      await otherOwnerPage.goto(link);
      await expect(
        otherOwnerPage.getByRole("heading", { name: "Rejoindre l'équipe" }),
      ).toBeVisible();
      await acceptInvitation(otherOwnerPage);

      await expect(
        otherOwnerPage
          .getByRole("main")
          .getByText(/Ramonage Lambert/)
          .filter({ visible: true }),
      ).toBeVisible();
      await expect(
        memberRow(otherOwnerPage, `${otherOwner.firstName} Dupont`).getByText("Technicien", {
          exact: true,
        }),
      ).toBeVisible();
      await otherOwnerContext.close();
    });
  });
}
