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

const chooseOption = async (page: Page, field: string, option: string) => {
  await page.getByLabel(field, { exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
};

const createCustomer = async (page: Page) => {
  await page.goto("/clients/nouveau");
  await page.getByLabel("Nom", { exact: true }).fill("Lefort");
  await page.getByLabel("Prénom").fill("Martine");
  await page.getByLabel("Adresse", { exact: true }).fill("12 rue du Pont de Créteil");
  await page.getByRole("button", { name: "Saisir à la main" }).click();
  await page.getByLabel("Code postal").fill("94100");
  await page.getByLabel("Ville").fill("Saint-Maur-des-Fossés");
  await page.getByRole("button", { name: "Enregistrer le client" }).click();
  await expect(page.getByRole("heading", { name: "Martine Lefort" })).toBeVisible();
};

const PLATE_PHOTO = {
  name: "plaque.jpg",
  mimeType: "image/jpeg",
  buffer: Buffer.from([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1, 255, 217]),
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
  await chooseOption(page, "Type d'appareil", "Chaudière");
  await chooseOption(page, "Combustible", "Gaz");
  await page.getByLabel("Marque").fill("Saunier Duval");
  await page.getByRole("button", { name: "Ajouter l'appareil" }).click();
  await expect(page.getByText("Chaudière gaz · Saunier Duval")).toBeVisible();

  await page.getByRole("button", { name: "Actions sur l'appareil" }).click();
  await page.getByRole("menuitem", { name: "Remplacer" }).click();
  await chooseOption(page, "Type d'appareil", "PAC air/eau");
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

test.describe("plate reading", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/**", (route) =>
      route.continue({
        headers: { ...route.request().headers(), "cf-connecting-ip": "203.0.113.24" },
      }),
    );
  });

  test("the plate photo fills the empty fields and leaves the typed ones", async ({ page }) => {
    await onboard(page, "plaque@example.fr");
    await createCustomer(page);
    await page.getByRole("link", { name: "Ajouter un appareil" }).click();
    await page.getByLabel("Modèle").fill("Ego 2.0 Air 8 Hydro");

    await page.getByLabel("Plaque signalétique").setInputFiles(PLATE_PHOTO);

    await expect(page.getByText("5 champs lus sur la plaque")).toBeVisible();
    await expect(page.getByText(/Le numéro de série est illisible/)).toBeVisible();
    await expect(page.getByText("Lue en partie")).toBeVisible();
    await expect(page.getByLabel("Type d'appareil", { exact: true })).toContainText(
      "Poêle à granulés",
    );
    await expect(page.getByLabel("Combustible", { exact: true })).toContainText("Granulés");
    await expect(page.getByLabel("Marque")).toHaveValue("MCZ");
    await expect(page.getByLabel("Modèle")).toHaveValue("Ego 2.0 Air 8 Hydro");
    await expect(page.getByLabel("Puissance (kW)")).toHaveValue("8");

    await page.getByRole("button", { name: "Ajouter l'appareil" }).click();
    await expect(page.getByText("Poêle à granulés · MCZ Ego 2.0 Air 8 Hydro")).toBeVisible();
  });

  test("a plate read past the daily limit pauses the reading and keeps the photo", async ({
    page,
  }) => {
    await onboard(page, "plaque-limite@example.fr");
    await createCustomer(page);
    await page.route("**/api/plate-readings", (route) =>
      route.fulfill({
        status: 429,
        json: { error: "plate_reading_limit_reached", traceId: "8c41d2e0ab12" },
      }),
    );
    await page.getByRole("link", { name: "Ajouter un appareil" }).click();

    await page.getByLabel("Plaque signalétique").setInputFiles(PLATE_PHOTO);

    await expect(page.getByText("Lecture automatique en pause jusqu'à demain")).toBeVisible();
    await expect(page.getByRole("img", { name: "Plaque signalétique" })).toBeVisible();
    await expect(page.getByLabel("Marque")).toHaveValue("");
  });
});

const answerPlateReading = (page: Page, answers: readonly object[]) => {
  const remaining = [...answers];
  return page.route("**/api/plate-readings", (route) =>
    route.fulfill({ status: 200, json: remaining.shift() ?? answers.at(-1) }),
  );
};

test.describe("plate reading outcomes", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/**", (route) =>
      route.continue({
        headers: { ...route.request().headers(), "cf-connecting-ip": "203.0.113.25" },
      }),
    );
  });

  test("an unreadable plate asks for a new photo, and the new photo fills the form", async ({
    page,
  }) => {
    await onboard(page, "plaque-illisible@example.fr");
    await createCustomer(page);
    await answerPlateReading(page, [
      { status: "unreadable", fields: {}, fieldCount: 0 },
      {
        status: "read",
        fields: {
          kind: "pellet_stove",
          energy: "pellets",
          brand: "MCZ",
          model: "Ego 2.0 Air 8",
          serialNumber: "MC-48213",
          powerKw: 8,
        },
        fieldCount: 6,
      },
    ]);
    await page.getByRole("link", { name: "Ajouter un appareil" }).click();

    await page.getByLabel("Plaque signalétique").setInputFiles(PLATE_PHOTO);

    await expect(page.getByText("Plaque illisible")).toBeVisible();
    await expect(page.getByText("Illisible", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Marque")).toHaveValue("");

    await page.getByLabel("Reprendre la photo").setInputFiles(PLATE_PHOTO);

    await expect(page.getByText("6 champs lus sur la plaque")).toBeVisible();
    await expect(page.getByText("Plaque illisible")).toBeHidden();
    await expect(page.getByLabel("Marque")).toHaveValue("MCZ");
    await expect(page.getByLabel("Numéro de série")).toHaveValue("MC-48213");
  });

  test("a heat pump plate fills the refrigerant and hides the fuel", async ({ page }) => {
    await onboard(page, "plaque-pac@example.fr");
    await createCustomer(page);
    await answerPlateReading(page, [
      {
        status: "partial",
        fields: {
          kind: "air_to_water_heat_pump",
          brand: "Atlantic",
          model: "Alfea Excellia",
          powerKw: 11,
          refrigerant: "R32",
          refrigerantChargeKg: 1.4,
        },
        fieldCount: 6,
      },
    ]);
    await page.getByRole("link", { name: "Ajouter un appareil" }).click();

    await page.getByLabel("Plaque signalétique").setInputFiles(PLATE_PHOTO);

    await expect(page.getByText("6 champs lus sur la plaque")).toBeVisible();
    await expect(page.getByLabel("Type d'appareil", { exact: true })).toContainText("PAC air/eau");
    await expect(page.getByLabel("Combustible", { exact: true })).toBeHidden();
    await expect(page.getByLabel("Fluide frigorigène")).toHaveValue("R32");
    await expect(page.getByLabel("Charge (kg)")).toHaveValue("1,40");
    await expect(page.getByLabel("Numéro de série")).toHaveValue("");
  });

  test("a failed reading shows its code and lets the technician fill the form by hand", async ({
    page,
  }) => {
    await onboard(page, "plaque-panne@example.fr");
    await createCustomer(page);
    await page.route("**/api/plate-readings", (route) =>
      route.fulfill({
        status: 503,
        json: { error: "plate_reader_unavailable", traceId: "5d7e91c0aa31" },
      }),
    );
    await page.getByRole("link", { name: "Ajouter un appareil" }).click();

    await page.getByLabel("Plaque signalétique").setInputFiles(PLATE_PHOTO);

    await expect(
      page.getByText("La plaque n'a pas pu être lue. Remplissez à la main."),
    ).toBeVisible();
    await expect(page.getByText("Code : 5d7e91c0")).toBeVisible();
    await expect(page.getByRole("img", { name: "Plaque signalétique" })).toBeVisible();

    await chooseOption(page, "Type d'appareil", "Chaudière");
    await chooseOption(page, "Combustible", "Gaz");
    await page.getByLabel("Marque").fill("Saunier Duval");
    await page.getByRole("button", { name: "Ajouter l'appareil" }).click();
    await expect(page.getByText("Chaudière gaz · Saunier Duval")).toBeVisible();
  });

  test("offline, the plate photo is kept and nothing is sent", async ({ page, context }) => {
    await onboard(page, "plaque-hors-ligne@example.fr");
    await createCustomer(page);
    const readings: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/plate-readings")) {
        readings.push(request.url());
      }
    });
    await page.getByRole("link", { name: "Ajouter un appareil" }).click();
    await expect(page.getByLabel("Plaque signalétique")).toBeAttached();
    await context.setOffline(true);

    await page.getByLabel("Plaque signalétique").setInputFiles(PLATE_PHOTO);

    await expect(page.getByRole("img", { name: "Plaque signalétique" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Lecture de la plaque…")).toBeHidden();
    await expect(
      page.getByText("La plaque n'a pas pu être lue. Remplissez à la main."),
    ).toBeHidden();
    await expect(page.getByLabel("Marque")).toHaveValue("");
    expect(readings).toHaveLength(0);
    await context.setOffline(false);
  });
});
