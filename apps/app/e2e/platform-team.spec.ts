import { expect, test, type Page } from "@playwright/test";
import * as z from "zod";
import { fillSignUpForm, newAccount, uniqueEmail } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import { emailLinkSentBy } from "./support/email-links";
import {
  enrollTwoFactor,
  fillTotpCode,
  openAdminSession,
  signInWithCode,
} from "./support/platform-admin";
import { MOBILE, VIEWPORTS } from "./support/viewports";

const uniqueLastName = () =>
  `Membre${
    crypto
      .randomUUID()
      .replaceAll(/[^a-f]/g, "")
      .slice(0, 6) || "abc"
  }`;

const meResponse = z.object({ admin: z.object({ userId: z.string() }) });

const openTeamPage = async (page: Page) => {
  await page.goto("/admin/equipe");
  await expect(page.getByRole("heading", { name: "Équipe Passalio" })).toBeVisible();
};

const memberRow = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByText(name, { exact: true }) });

const pendingInvitation = (page: Page, email: string) =>
  page
    .getByRole("listitem")
    .filter({ hasText: email })
    .filter({ has: page.getByRole("button", { name: "Renvoyer" }) });

const openMemberAction = async (page: Page, name: string, action: string) => {
  if (page.viewportSize()?.width === MOBILE.width) {
    await page.getByRole("button", { name: `Actions pour ${name}` }).click();
    await page.getByRole("menuitem", { name: action }).click();
    return;
  }
  await memberRow(page, name).getByRole("button", { name: action }).click();
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });
    test.describe.configure({ timeout: 90_000 });

    test("a super admin invites a member who joins by email then activates two-factor", async ({
      browser,
    }) => {
      const superadmin = await openAdminSession(browser, size, "superadmin");
      const inviteeEmail = uniqueEmail("antho");
      const invitee = newAccount({
        firstName: "Antho",
        lastName: uniqueLastName(),
        email: inviteeEmail,
      });
      await openTeamPage(superadmin.page);

      await superadmin.page.getByRole("button", { name: "Inviter un membre" }).click();
      const dialog = superadmin.page.getByRole("dialog");
      await expect(dialog.getByRole("radio", { name: /^Admin/ })).toBeChecked();
      await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();
      await expect(dialog.getByText("Saisissez une adresse e-mail valide.")).toBeVisible();
      await dialog.getByLabel("E-mail").fill(inviteeEmail);
      await dialog.getByRole("radio", { name: /^Commercial/ }).check();
      const link = await emailLinkSentBy("team_invitation", async () => {
        await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();
        await expect(
          superadmin.page.getByText(`Invitation envoyée à ${inviteeEmail}.`),
        ).toBeVisible();
      });
      await expect(dialog).toHaveCount(0);
      await expect(pendingInvitation(superadmin.page, inviteeEmail)).toBeVisible();

      const inviteeContext = await browser.newContext({ viewport: size });
      await assignClientIp(inviteeContext);
      const page = await inviteeContext.newPage();
      await page.goto(link);
      await expect(page).toHaveURL(/\/connexion\?retour=/);
      await expect(page.getByRole("link", { name: "Créer un compte" })).toBeVisible();
      await page.getByRole("link", { name: "Créer un compte" }).click();
      await fillSignUpForm(page, invitee);

      await expect(page).toHaveURL(/\/equipe-passalio\/invitations\//);
      await expect(
        page.getByRole("heading", { name: "Rejoindre l'équipe Passalio" }),
      ).toBeVisible();
      await expect(page.getByText("Commercial", { exact: true })).toBeVisible();
      await expect(page.getByText(`Vous êtes connecté avec ${inviteeEmail}.`)).toBeVisible();
      await page.getByRole("button", { name: "Rejoindre l'équipe" }).click();
      await expect(page.getByText("Bienvenue dans l'équipe Passalio.")).toBeVisible();

      await enrollTwoFactor(page, invitee.password);
      await expect(page).toHaveURL(/\/admin\/entreprises/);
      await expect(page.getByRole("heading", { name: "Entreprises" })).toBeVisible();

      await superadmin.page.reload();
      await expect(superadmin.page.getByRole("heading", { name: "Équipe Passalio" })).toBeVisible();
      const row = memberRow(superadmin.page, `${invitee.firstName} ${invitee.lastName}`);
      await expect(row).toBeVisible();
      await expect(
        row.getByText("Commercial", { exact: true }).filter({ visible: true }).first(),
      ).toBeVisible();
      await expect(pendingInvitation(superadmin.page, inviteeEmail)).toHaveCount(0);

      await page.goto(link);
      await expect(
        page.getByRole("heading", { name: "Cette invitation n'est plus valable" }),
      ).toBeVisible();
      await inviteeContext.close();
      await superadmin.context.close();
    });

    test("an invitation opened with another account is refused", async ({ browser }) => {
      const superadmin = await openAdminSession(browser, size, "superadmin");
      const inviteeEmail = uniqueEmail("invite");
      await openTeamPage(superadmin.page);
      await superadmin.page.getByRole("button", { name: "Inviter un membre" }).click();
      const dialog = superadmin.page.getByRole("dialog");
      await dialog.getByLabel("E-mail").fill(inviteeEmail);
      const link = await emailLinkSentBy("team_invitation", async () => {
        await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();
        await expect(
          superadmin.page.getByText(`Invitation envoyée à ${inviteeEmail}.`),
        ).toBeVisible();
      });

      await superadmin.page.goto(link);
      await expect(
        superadmin.page.getByRole("heading", {
          name: "Cette invitation est pour une autre adresse",
        }),
      ).toBeVisible();
      await expect(superadmin.page.getByRole("button", { name: "Rejoindre l'équipe" })).toHaveCount(
        0,
      );
      await superadmin.context.close();
    });

    test("a super admin resends then cancels a pending invitation", async ({ browser }) => {
      const superadmin = await openAdminSession(browser, size, "superadmin");
      const inviteeEmail = uniqueEmail("relance");
      await openTeamPage(superadmin.page);
      await superadmin.page.getByRole("button", { name: "Inviter un membre" }).click();
      const dialog = superadmin.page.getByRole("dialog");
      await dialog.getByLabel("E-mail").fill(inviteeEmail);
      const firstLink = await emailLinkSentBy("team_invitation", async () => {
        await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();
        await expect(
          superadmin.page.getByText(`Invitation envoyée à ${inviteeEmail}.`),
        ).toBeVisible();
      });
      const invitation = pendingInvitation(superadmin.page, inviteeEmail);
      await expect(invitation).toBeVisible();

      const resentLink = await emailLinkSentBy("team_invitation", async () => {
        await invitation.getByRole("button", { name: "Renvoyer" }).click();
        await expect(
          superadmin.page.getByText(`Invitation renvoyée à ${inviteeEmail}.`),
        ).toBeVisible();
      });
      expect(firstLink).toContain("/equipe-passalio/invitations/");
      expect(resentLink).toContain("/equipe-passalio/invitations/");

      await invitation.getByRole("button", { name: "Annuler" }).click();
      await expect(
        superadmin.page.getByText(`Invitation à ${inviteeEmail} annulée.`),
      ).toBeVisible();
      await expect(invitation).toHaveCount(0);

      await superadmin.page.goto(resentLink);
      await expect(
        superadmin.page.getByRole("heading", { name: "Cette invitation n'est plus valable" }),
      ).toBeVisible();
      await superadmin.context.close();
    });

    test("a super admin changes the role of a member then removes them from the team", async ({
      browser,
    }) => {
      const superadmin = await openAdminSession(browser, size, "superadmin");
      const member = await openAdminSession(browser, size, "admin", {
        firstName: "Elise",
        lastName: uniqueLastName(),
      });
      const memberName = `${member.member.firstName} ${member.member.lastName}`;
      await openTeamPage(superadmin.page);
      await expect(memberRow(superadmin.page, memberName)).toBeVisible();

      await openMemberAction(superadmin.page, memberName, "Changer le rôle");
      const roleDialog = superadmin.page.getByRole("dialog");
      await expect(
        roleDialog.getByRole("heading", { name: `Changer le rôle d'${memberName}` }),
      ).toBeVisible();
      await expect(roleDialog.getByRole("radio", { name: /^Admin · rôle actuel/ })).toBeChecked();
      await roleDialog.getByRole("radio", { name: /^Commercial/ }).check();
      await roleDialog.getByRole("button", { name: "Changer le rôle" }).click();
      await expect(
        superadmin.page.getByText(`${memberName} est maintenant Commercial.`),
      ).toBeVisible();
      await expect(
        memberRow(superadmin.page, memberName)
          .getByText("Commercial", { exact: true })
          .filter({ visible: true })
          .first(),
      ).toBeVisible();

      await member.page.goto("/admin/comptes");
      await expect(member.page).toHaveURL(/\/connexion/);

      await openMemberAction(superadmin.page, memberName, "Retirer");
      const removeDialog = superadmin.page.getByRole("alertdialog");
      await expect(
        removeDialog.getByRole("heading", { name: `Retirer ${memberName} de l'équipe ?` }),
      ).toBeVisible();
      await removeDialog.getByRole("button", { name: "Retirer de l'équipe" }).click();
      await expect(
        superadmin.page.getByText(`${memberName} ne fait plus partie de l'équipe.`),
      ).toBeVisible();
      await expect(memberRow(superadmin.page, memberName)).toHaveCount(0);

      await signInWithCode(member.page, member.member);
      await fillTotpCode(member.page, "Code à 6 chiffres", member.member.secret);
      await member.page.getByRole("button", { name: "Vérifier" }).click();
      await expect(member.page).toHaveURL(/\/configuration\/entreprise/);
      await member.page.goto("/admin");
      await expect(member.page).not.toHaveURL(/\/admin/);
      await member.context.close();
      await superadmin.context.close();
    });

    test("a super admin cannot change their own role", async ({ browser }) => {
      const superadmin = await openAdminSession(browser, size, "superadmin", {
        firstName: "Quentin",
        lastName: uniqueLastName(),
      });
      const selfName = `${superadmin.member.firstName} ${superadmin.member.lastName}`;
      await openTeamPage(superadmin.page);

      const selfRow = memberRow(superadmin.page, selfName);
      await expect(selfRow).toBeVisible();
      await expect(selfRow.getByRole("button", { name: "Changer le rôle" })).toHaveCount(0);
      await expect(selfRow.getByRole("button", { name: "Retirer" })).toHaveCount(0);
      await expect(
        superadmin.page.getByRole("button", { name: `Actions pour ${selfName}` }),
      ).toHaveCount(0);

      const me = meResponse.parse(
        await (await superadmin.page.request.get("/api/admin/me")).json(),
      );
      const refused = await superadmin.page.request.patch(
        `/api/admin/team/members/${me.admin.userId}`,
        {
          data: { role: "admin" },
        },
      );
      expect(refused.status()).toBe(409);

      await superadmin.page.reload();
      await expect(
        memberRow(superadmin.page, selfName)
          .getByText("Super admin", { exact: true })
          .filter({ visible: true })
          .first(),
      ).toBeVisible();
      await superadmin.context.close();
    });
  });
}
