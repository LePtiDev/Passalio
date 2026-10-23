import { expect, test, type Page } from "@playwright/test";

const OWN_CLIENT_ADDRESS = "198.51.100.21";

test.use({ viewport: { width: 1440, height: 900 } });

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
  await page.getByLabel("Adresse email professionnelle").fill("types-de-passage@example.fr");
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

const changeChimneySweepingDuration = async (page: Page, duration: string) => {
  await page.goto("/reglages");
  await page.getByRole("link", { name: "Types de passage" }).first().click();
  await expect(page).toHaveURL(/\/reglages\/types-de-passage/);
  await expect(page.getByRole("heading", { name: "Types de passage" }).first()).toBeVisible();
  const select = page.getByRole("combobox", { name: "Durée par défaut : Ramonage" });
  await expect(select).toHaveText("1 h");
  await select.click();
  await page.getByRole("option", { name: duration, exact: true }).click();
  await expect(
    page.getByText("Durée enregistrée. Elle s'applique aux prochains passages."),
  ).toBeVisible();
  await expect(select).toHaveText(duration);
};

test("the owner sets the chimney sweeping duration, then plans a visit that uses it", async ({
  page,
}) => {
  await onboard(page);
  await addCustomer(page);
  await changeChimneySweepingDuration(page, "1 h 30");

  await page.reload();
  await expect(page.getByRole("combobox", { name: "Durée par défaut : Ramonage" })).toHaveText(
    "1 h 30",
  );

  await page.goto("/planning/nouveau?jour=2030-03-12");
  await page.getByLabel("Client").fill("garn");
  await page.getByRole("button", { name: /Hélène Garnier/ }).click();

  const visitType = page.locator("#visit-type");
  const duration = page.getByRole("combobox", { name: "Durée" });
  await expect(visitType).toHaveText(/Ramonage/);
  await expect(duration).toHaveText("1 h 30");
  await expect(
    page.getByText("Durée habituelle d'un ramonage. Vous pouvez la changer."),
  ).toBeVisible();

  await duration.click();
  await page.getByRole("option", { name: "2 h", exact: true }).click();
  await expect(duration).toHaveText("2 h");
  await expect(page.getByText("Modifiée pour ce passage. Habituellement 1 h 30.")).toBeVisible();
  await page.getByRole("button", { name: "Remettre 1 h 30" }).click();
  await expect(duration).toHaveText("1 h 30");
  await expect(
    page.getByText("Durée habituelle d'un ramonage. Vous pouvez la changer."),
  ).toBeVisible();

  await page.getByLabel("Heure").fill("10:00");
  await page.getByRole("button", { name: "Ajouter au planning" }).last().click();

  await expect(page).toHaveURL(/\/planning\?jour=2030-03-12/);
  const visit = page.getByRole("link", { name: "Hélène Garnier, 10:00 – 11:30" });
  await expect(visit).toBeVisible();
  await visit.click();
  const panel = page.getByRole("complementary", { name: "Passage" });
  await expect(panel.getByText("Ramonage", { exact: true })).toBeVisible();
  await panel.getByRole("link", { name: "Ouvrir le passage" }).click();
  await expect(page.getByRole("heading", { name: "Hélène Garnier", level: 1 })).toBeVisible();
  await expect(page.getByRole("term").filter({ hasText: "Type de passage" })).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: "Ramonage · 1 h 30" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("definition").filter({ hasText: "Ramonage · 1 h 30" })).toBeVisible();
});
