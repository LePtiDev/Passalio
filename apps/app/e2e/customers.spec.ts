import { expect, test, type Page } from "@playwright/test";

const onboard = async (page: Page, email = "clients@example.fr") => {
  await page.goto("/connexion");
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await page.getByLabel("Prénom").fill("Jean");
  await page.getByLabel("Nom", { exact: true }).fill("Dupont");
  await page.getByLabel("Adresse email professionnelle").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("cheminee-propre-2026");
  await page.getByRole("checkbox", { name: /J'accepte les conditions/ }).click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/configuration\/entreprise/);
  await page.getByLabel("Nom affiché sur les documents").fill("Ramonage Dupont");
  await page.getByLabel("SIRET").fill("123 456 789 00012");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/configuration\/metiers/);
  await page.getByText("Ramonage", { exact: true }).click();
  await page.getByText("Pompe à chaleur et climatisation", { exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/configuration\/documents/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/configuration\/equipe/);
  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(page.getByRole("heading", { name: "Bonjour Jean" })).toBeVisible();
};

test("a technician creates a customer, adds a boiler, then replaces it by a heat pump", async ({
  page,
}) => {
  await onboard(page);
  await page.goto("/clients");
  await expect(page.getByText("Ajoutez votre premier client")).toBeVisible();

  await page.getByRole("link", { name: "Nouveau client" }).first().click();
  await page.getByRole("button", { name: "Enregistrer le client" }).click();
  await expect(page.getByText("Indiquez le nom du client.")).toBeVisible();
  await page.getByLabel("Nom", { exact: true }).fill("Moreau");
  await page.getByLabel("Prénom").fill("Jean-Pierre");
  await page.getByLabel("Téléphone").fill("06 98 76 54 32");
  await page.getByLabel("Adresse", { exact: true }).fill("45 boulevard de Strasbourg");
  await page.getByRole("button", { name: "Saisir à la main" }).click();
  await page.getByLabel("Code postal").fill("94130");
  await page.getByLabel("Ville").fill("Nogent-sur-Marne");
  await page.getByRole("button", { name: "Enregistrer le client" }).click();

  await expect(page.getByText("Client ajouté. Il est enregistré sur ce téléphone.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jean-Pierre Moreau" })).toBeVisible();
  await expect(page.getByText("Aucun appareil sur ce lieu")).toBeVisible();

  await page.getByRole("link", { name: "Ajouter un appareil" }).click();
  await page.getByRole("button", { name: "Ajouter l'appareil" }).click();
  await expect(page.getByText("Choisissez le type d'appareil.")).toBeVisible();
  await page.getByText("Chaudière", { exact: true }).click();
  await page.getByText("Gaz", { exact: true }).click();
  await page.getByLabel("Marque").fill("Saunier Duval");
  await page.getByRole("button", { name: "Ajouter l'appareil" }).click();
  await expect(page.getByText("Chaudière gaz · Saunier Duval")).toBeVisible();

  await page.getByRole("button", { name: "Actions sur l'appareil" }).click();
  await page.getByRole("menuitem", { name: "Remplacer" }).click();
  await page.getByText("PAC air/eau", { exact: true }).click();
  await page.getByLabel("Marque").fill("Atlantic");
  await page.getByLabel("Fluide frigorigène").fill("R32");
  await expect(page.getByLabel("Remplace")).toContainText("Chaudière gaz · Saunier Duval");
  await page.getByRole("button", { name: "Ajouter l'appareil" }).click();

  await expect(
    page.getByText("Appareil remplacé. L'ancien reste dans l'historique."),
  ).toBeVisible();
  await expect(page.getByText("PAC air/eau · Atlantic")).toBeVisible();
  await expect(page.getByRole("button", { name: "Appareils retirés (1)" })).toBeVisible();
  await expect(page.getByText(/remplacée par la pompe à chaleur/)).toBeVisible();
  await expect(page.getByText("Particulier · à jour")).toBeVisible({ timeout: 15_000 });

  await page.reload();
  await expect(page.getByText("PAC air/eau · Atlantic")).toBeVisible();
  await page.goto("/clients");
  await expect(page.getByRole("link", { name: /Jean-Pierre Moreau/ })).toBeVisible();
  await page.getByLabel("Rechercher un client").fill("nogent");
  await expect(page.getByRole("link", { name: /Jean-Pierre Moreau/ })).toBeVisible();
});

test("switching tabs does not wait for the server to confirm the session again", async ({
  page,
}) => {
  await onboard(page, "onglets@example.fr");
  const sessionChecks: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/auth/get-session")) {
      sessionChecks.push(request.url());
    }
  });
  const tabs = page.getByRole("navigation", { name: "Navigation principale" });

  await tabs.getByRole("link", { name: "Clients" }).click();
  await expect(page.getByText("Ajoutez votre premier client")).toBeVisible();
  await tabs.getByRole("link", { name: "Réglages" }).click();
  await expect(page).toHaveURL(/\/reglages/);
  await tabs.getByRole("link", { name: "Accueil" }).click();
  await expect(page.getByRole("heading", { name: "Bonjour Jean" })).toBeVisible();

  expect(sessionChecks).toHaveLength(0);
});
