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

  await expect(page).toHaveURL(/\/entreprise\/nouvelle/);
  await page.getByLabel("Nom de l'entreprise").fill("Ramonage Dupont");
  await page.getByRole("button", { name: "Créer l'entreprise" }).click();

  await expect(page).toHaveURL(/\/equipe/);
  await expect(page.getByText("Vous êtes seul pour l'instant")).toBeVisible();
  await page.getByLabel("Adresse email").fill("tech@example.fr");
  await page.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page.getByText("Invitation envoyée à tech@example.fr")).toBeVisible();
  await expect.poll(() => countEmailLinks(API_LOG_PATH, "invitation")).toBe(1);

  const invitationLink = await lastEmailLink(API_LOG_PATH, "invitation");
  const technicianContext = await browser.newContext();
  const technician = await technicianContext.newPage();
  await technician.goto(invitationLink);
  await expect(technician).toHaveURL(/\/connexion/);
  await signUp(technician, "Marc", "tech@example.fr");
  await technician.getByRole("button", { name: "Accepter l'invitation" }).click();

  await expect(technician).toHaveURL(/\/equipe/);
  await expect(technician.getByText("patron@example.fr")).toBeVisible();
  await expect(technician.getByRole("button", { name: "Envoyer l'invitation" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByLabel("Rôle de Marc Dupont")).toBeVisible();
  await technicianContext.close();
});

test("a user who forgot the password sets a new one and signs in with it", async ({ page }) => {
  await page.goto("/connexion");
  await signUp(page, "Paul", "oubli@example.fr");
  await expect(page).toHaveURL(/\/entreprise\/nouvelle/);
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
  await expect(page).toHaveURL(/\/entreprise\/nouvelle/);
});
