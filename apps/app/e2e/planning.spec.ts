import { expect, test, type Page } from "@playwright/test";

const OWN_CLIENT_ADDRESS = "198.51.100.20";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) =>
    route.continue({
      headers: { ...route.request().headers(), "cf-connecting-ip": OWN_CLIENT_ADDRESS },
    }),
  );
});

const onboard = async (page: Page) => {
  await page.goto("/connexion");
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await page.getByLabel("Prénom").fill("Jean");
  await page.getByLabel("Nom", { exact: true }).fill("Dupont");
  await page.getByLabel("Adresse email professionnelle").fill("planning@example.fr");
  await page.getByLabel("Mot de passe", { exact: true }).fill("cheminee-propre-2026");
  await page.getByRole("checkbox", { name: /J'accepte les conditions/ }).click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/configuration\/entreprise/);
  await page.getByLabel("Nom affiché sur les documents").fill("Ramonage Dupont");
  await page.getByLabel("SIRET").fill("123 456 789 00012");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/configuration\/metiers/);
  await page.getByText("Ramonage", { exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/configuration\/documents/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/configuration\/equipe/);
  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(page.getByRole("heading", { name: "Bonjour Jean" })).toBeVisible();
};

const addCustomer = async (page: Page) => {
  await page.goto("/clients/nouveau");
  await page.getByLabel("Nom", { exact: true }).fill("Garnier");
  await page.getByLabel("Prénom").fill("Hélène");
  await page.getByLabel("Adresse", { exact: true }).fill("8 rue de la Paix");
  await page.getByRole("button", { name: "Saisir à la main" }).click();
  await page.getByLabel("Code postal").fill("94170");
  await page.getByLabel("Ville").fill("Le Perreux-sur-Marne");
  await page.getByRole("button", { name: "Enregistrer le client" }).click();
  await expect(page.getByRole("heading", { name: "Hélène Garnier" })).toBeVisible();
};

test("the owner plans a visit for a customer, opens it, then cancels it", async ({ page }) => {
  await onboard(page);
  await addCustomer(page);

  await page.goto("/planning?jour=2030-03-12");
  await expect(page.getByRole("heading", { name: "Aucun passage ce jour" })).toBeVisible();
  await page.getByRole("link", { name: "Nouveau passage" }).first().click();
  await expect(page).toHaveURL(/\/planning\/nouveau\?jour=2030-03-12/);

  await page.getByRole("button", { name: "Ajouter au planning" }).last().click();
  await expect(page.getByText("Choisissez le client.")).toBeVisible();
  await expect(page.getByText("Indiquez l'heure.")).toBeVisible();

  await page.getByLabel("Client").fill("garn");
  await page.getByRole("button", { name: /Hélène Garnier/ }).click();
  await page.getByLabel("Heure").fill("10:00");
  await page.getByLabel("Prix annoncé").fill("75 €");
  await page.getByRole("button", { name: "Ajouter au planning" }).last().click();

  await expect(page).toHaveURL(/\/planning\?jour=2030-03-12/);
  const visit = page.getByRole("link", { name: /Hélène Garnier, 10:00/ });
  await expect(visit).toBeVisible();

  await visit.click();
  await expect(page.getByRole("heading", { name: "Passage de 10:00" })).toBeVisible();
  await expect(page.getByText("Hélène Garnier").filter({ visible: true }).first()).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Passage de 10:00" })).toBeVisible();

  await page.getByRole("button", { name: "Actions sur le passage" }).click();
  await page.getByRole("menuitem", { name: "Annuler le passage" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Annuler le passage" }).click();
  await expect(page.getByText("Passage annulé.")).toBeVisible();
  await expect(page).toHaveURL(/\/planning\?jour=2030-03-12/);
  await expect(page.getByRole("heading", { name: "Aucun passage ce jour" })).toBeVisible();
});
