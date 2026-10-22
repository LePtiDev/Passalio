import { expect, test, type Page } from "@playwright/test";
import { API_LOG_PATH } from "../playwright.config";
import { countEmailLinks, lastEmailLink } from "./emails";

const PASSWORD = "cheminee-propre-2026";

const signUp = async (page: Page, firstName: string, email: string) => {
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await expect(page).toHaveURL(/\/inscription/);
  await page.getByLabel("Prénom").fill(firstName);
  await page.getByLabel("Nom", { exact: true }).fill("Dupont");
  await page.getByLabel("Adresse email professionnelle").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByText("J'accepte les conditions").click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
};

test("an owner creates the company, invites a technician who joins the team", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/connexion/);
  await signUp(page, "Jean", "patron@example.fr");

  await expect(page).toHaveURL(/\/configuration\/entreprise/);
  await page.getByLabel("Nom affiché sur les documents").fill("Ramonage Dupont");
  await page.getByLabel("SIRET").fill("123 456 789 00012");
  await page.getByRole("button", { name: "Continuer" }).click();

  await expect(page).toHaveURL(/\/configuration\/metiers/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText("Choisissez au moins un métier.")).toBeVisible();
  await page.getByText("Ramonage", { exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();

  await expect(page).toHaveURL(/\/configuration\/documents/);
  await page.getByRole("button", { name: "Vert" }).click();
  await page.getByLabel("Premier numéro").fill("0142");
  await expect(page.getByText(`N° ${new Date().getFullYear()}-0142`)).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();

  await expect(page).toHaveURL(/\/configuration\/equipe/);
  await page.getByLabel("Adresse email 1").fill("tech@example.fr");
  await page.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page.getByText("1 invitation envoyée.")).toBeVisible();
  await expect.poll(() => countEmailLinks(API_LOG_PATH, "invitation")).toBe(1);
  await expect(page).toHaveURL(/bienvenue=true/);
  await expect(
    page.getByText("Votre espace est prêt. 1 invitation envoyée à votre équipe."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bonjour Jean" })).toBeVisible();

  const invitationLink = await lastEmailLink(API_LOG_PATH, "invitation");
  const technicianContext = await browser.newContext();
  const technician = await technicianContext.newPage();
  await technician.goto(invitationLink);
  await expect(technician).toHaveURL(/\/connexion/);
  await signUp(technician, "Marc", "tech@example.fr");
  await technician.getByRole("button", { name: "Accepter l'invitation" }).click();

  await expect(technician).toHaveURL(/\/equipe/);
  await expect(technician.getByText("patron@example.fr")).toBeVisible();
  await expect(technician.getByRole("button", { name: "Inviter une personne" })).toHaveCount(0);

  await page.goto("/equipe");
  await expect(page.getByLabel("Rôle de Marc Dupont")).toBeVisible();
  await page.getByLabel("Rôle de Marc Dupont").click();
  await page.getByRole("menuitemradio", { name: "Secrétariat" }).click();
  await expect(page.getByText("Marc Dupont est maintenant secrétariat.")).toBeVisible();

  await page.getByRole("button", { name: "Inviter une personne" }).click();
  await page.getByRole("dialog").getByLabel("Adresse email").fill("apprenti@example.fr");
  await page.getByRole("dialog").getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page.getByText("Invitation envoyée à apprenti@example.fr.")).toBeVisible();
  await page.getByRole("tab", { name: /en attente/i }).click();
  await expect(page.getByText("apprenti@example.fr", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Annuler l'invitation apprenti@example.fr" }).click();
  await expect(page.getByText("Aucune invitation en attente")).toBeVisible();
  await technicianContext.close();
});

test("a user who forgot the password sets a new one and signs in with it", async ({ page }) => {
  await page.goto("/connexion");
  await signUp(page, "Paul", "oubli@example.fr");
  await expect(page).toHaveURL(/\/configuration\/entreprise/);
  await page.context().clearCookies();

  await page.goto("/connexion");
  await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
  await page.getByLabel("Adresse email").fill("oubli@example.fr");
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByText("Si un compte existe pour cette adresse")).toBeVisible();
  await expect.poll(() => countEmailLinks(API_LOG_PATH, "password_reset")).toBe(1);

  await page.goto(await lastEmailLink(API_LOG_PATH, "password_reset"));
  await expect(page).toHaveURL(/\/mot-de-passe\/nouveau\?token=/);
  await page.getByLabel("Nouveau mot de passe", { exact: true }).fill("nouveau-ramonage-2027");
  await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();

  await expect(page).toHaveURL(/\/connexion/);
  await page.getByLabel("Adresse email").fill("oubli@example.fr");
  await page.getByLabel("Mot de passe", { exact: true }).fill("nouveau-ramonage-2027");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/configuration\/entreprise/);
});
