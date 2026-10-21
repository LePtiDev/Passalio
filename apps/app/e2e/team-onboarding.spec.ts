import { expect, test, type Page } from "@playwright/test";
import { API_LOG_PATH } from "../playwright.config";
import { countEmailLinks, lastEmailLink } from "./emails";

const signInWithMagicLink = async (page: Page, email: string) => {
  const sentBefore = await countEmailLinks(API_LOG_PATH, "magic_link");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByText("Vérifiez votre boîte mail")).toBeVisible();
  await expect.poll(() => countEmailLinks(API_LOG_PATH, "magic_link")).toBe(sentBefore + 1);
  await page.goto(await lastEmailLink(API_LOG_PATH, "magic_link"));
};

test("an owner creates the company, invites a technician who joins the team", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/connexion/);
  await signInWithMagicLink(page, "patron@example.fr");

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
  await signInWithMagicLink(technician, "tech@example.fr");
  await technician.getByRole("button", { name: "Accepter l'invitation" }).click();

  await expect(technician).toHaveURL(/\/equipe/);
  await expect(technician.getByText("patron@example.fr")).toBeVisible();
  await expect(technician.getByRole("button", { name: "Envoyer l'invitation" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByLabel("Rôle de tech@example.fr")).toBeVisible();
  await technicianContext.close();
});
