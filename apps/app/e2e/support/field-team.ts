import { expect, type Browser, type Page, type ViewportSize } from "@playwright/test";
import { fillSignUpForm, newAccount } from "./accounts";
import { emailLinkSentBy } from "./email-links";
import { openFieldContext } from "./field-context";

export type TeamRole = "Technicien" | "Secrétariat" | "Administrateur";

const inviteMember = async (owner: Page, email: string, role: TeamRole) => {
  await owner.goto("/equipe");
  await expect(owner.getByRole("heading", { name: "Équipe" })).toBeVisible();
  await owner.getByRole("button", { name: "Inviter une personne" }).first().click();
  const dialog = owner.getByRole("dialog", { name: "Inviter une personne" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Adresse email").fill(email);
  await dialog.getByRole("combobox", { name: "Rôle" }).click();
  await owner.getByRole("option", { name: role }).click();
  await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(owner.getByText(`Invitation envoyée à ${email}.`, { exact: false })).toBeVisible();
};

export const joinTeamAs = async (
  browser: Browser,
  viewport: ViewportSize,
  owner: Page,
  role: TeamRole,
) => {
  const account = newAccount({ firstName: role === "Technicien" ? "Marc" : "Sophie" });
  const link = await emailLinkSentBy("invitation", () => inviteMember(owner, account.email, role));
  const context = await openFieldContext(browser, viewport);
  const page = await context.newPage();
  await page.goto(link);
  await expect(page).toHaveURL(/\/connexion/);
  await expect(page.getByRole("link", { name: "Créer un compte" })).toBeVisible();
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await fillSignUpForm(page, account);
  await expect(page.getByRole("button", { name: "Accepter l'invitation" })).toBeVisible();
  await page.getByRole("button", { name: "Accepter l'invitation" }).click();
  await expect(page).toHaveURL(/\/equipe/);
  return { context, page, account };
};
