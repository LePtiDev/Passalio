import { expect, type Browser, type Page, type ViewportSize } from "@playwright/test";
import { fillSignUpForm, newAccount, type NewAccount } from "./accounts";
import { assignClientIp } from "./client-ip";
import { emailLinkSentBy } from "./email-links";

export type InvitedRole = "Administrateur" | "Secrétariat" | "Technicien";

export const openTeamScreen = async (page: Page) => {
  await page.goto("/equipe");
  await expect(page.getByRole("heading", { name: "Équipe" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Membres/ })).toBeVisible();
};

export const openPendingInvitations = async (page: Page) => {
  await page.getByRole("tab", { name: /en attente/i }).click();
  await expect(page.getByRole("tab", { name: /en attente/i })).toHaveAttribute(
    "aria-selected",
    "true",
  );
};

export const inviteFromTeamScreen = (page: Page, email: string, role: InvitedRole = "Technicien") =>
  emailLinkSentBy("invitation", async () => {
    await page.getByRole("button", { name: "Inviter une personne" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Inviter une personne" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Adresse email").fill(email);
    await dialog.getByRole("combobox", { name: "Rôle" }).click();
    await page.getByRole("option", { name: role }).click();
    await expect(dialog.getByRole("combobox", { name: "Rôle" })).toHaveText(role);
    await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();
    await expect(
      page.getByText(`Invitation envoyée à ${email}. Elle est valable 7 jours.`),
    ).toBeVisible();
    await expect(dialog).toBeHidden();
  });

export const signUpFromInvitation = async (page: Page, link: string, account: NewAccount) => {
  await page.goto(link);
  await expect(page).toHaveURL(/\/connexion\?retour=/);
  await expect(page.getByRole("link", { name: "Créer un compte" })).toBeVisible();
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await fillSignUpForm(page, account);
  await expect(page.getByRole("heading", { name: "Rejoindre l'équipe" })).toBeVisible();
};

export const acceptInvitation = async (page: Page) => {
  await page.getByRole("button", { name: "Accepter l'invitation" }).click();
  await expect(page).toHaveURL(/\/equipe/);
  await expect(page.getByText("Bienvenue dans l'équipe.")).toBeVisible();
};

export type JoinOptions = {
  readonly viewport: Readonly<ViewportSize>;
  readonly account?: Partial<NewAccount>;
};

export const joinTeam = async (browser: Browser, link: string, options: JoinOptions) => {
  const context = await browser.newContext({ viewport: options.viewport });
  await assignClientIp(context);
  const page = await context.newPage();
  const account = newAccount(options.account);
  await signUpFromInvitation(page, link, account);
  await acceptInvitation(page);
  return { context, page, account, name: `${account.firstName} ${account.lastName}` };
};
