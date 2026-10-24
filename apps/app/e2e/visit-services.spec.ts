import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { API_LOG_PATH } from "../playwright.config";
import { countEmailLinks, lastEmailLink } from "./emails";

const OWN_CLIENT_ADDRESS = "198.51.100.21";

const PASSWORD = "cheminee-propre-2026";

const useOwnClientAddress = async (context: BrowserContext) => {
  await context.route("**/api/**", (route) =>
    route.continue({
      headers: { ...route.request().headers(), "cf-connecting-ip": OWN_CLIENT_ADDRESS },
    }),
  );
};

test.beforeEach(async ({ context }) => {
  await useOwnClientAddress(context);
});

const signUp = async (page: Page, firstName: string, email: string) => {
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await page.getByLabel("Prénom").fill(firstName);
  await page.getByLabel("Nom", { exact: true }).fill("Dupont");
  await page.getByLabel("Adresse email professionnelle").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByRole("checkbox", { name: /J'accepte les conditions/ }).click();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
};

const createCompany = async (page: Page, email: string) => {
  await page.goto("/connexion");
  await signUp(page, "Jean", email);
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
};

const onboardWithTechnician = async (page: Page) => {
  const invitationsBefore = await countEmailLinks(API_LOG_PATH, "invitation");
  await createCompany(page, "prestations@example.fr");
  await page.getByLabel("Adresse email 1").fill("technicien-prestations@example.fr");
  await page.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page.getByRole("heading", { name: "Bonjour Jean" })).toBeVisible();
  await expect.poll(() => countEmailLinks(API_LOG_PATH, "invitation")).toBe(invitationsBefore + 1);
  return lastEmailLink(API_LOG_PATH, "invitation");
};

const joinAsTechnician = async (context: BrowserContext, invitationLink: string) => {
  await useOwnClientAddress(context);
  const technician = await context.newPage();
  await technician.goto(invitationLink);
  await expect(technician).toHaveURL(/\/connexion/);
  await signUp(technician, "Marc", "technicien-prestations@example.fr");
  await technician.getByRole("button", { name: "Accepter l'invitation" }).click();
  await expect(technician).toHaveURL(/\/equipe/);
  return technician;
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

const createService = async (
  page: Page,
  { name, duration, price }: { name: string; duration: string; price: string },
) => {
  await page.getByRole("button", { name: "Nouvelle prestation" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Nouvelle prestation" });
  await dialog.getByLabel("Nom").fill(name);
  await dialog.getByRole("combobox", { name: "Durée" }).click();
  await page.getByRole("option", { name: duration, exact: true }).click();
  await dialog.getByLabel("Prix TTC").fill(price);
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Prestation ajoutée.")).toBeVisible();
  await expect(dialog).toBeHidden();
};

const serviceRow = (page: Page, name: string) =>
  page.getByRole("button", { name: `Modifier ${name}` });

const setUpServices = async (page: Page) => {
  await page.goto("/reglages");
  await page.getByRole("link", { name: "Prestations" }).first().click();
  await expect(page).toHaveURL(/\/reglages\/prestations/);
  await expect(page.getByText("Aucune prestation", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Ajouter les prestations de vos métiers" }).click();
  await expect(
    page.getByText("Prestations ajoutées. Vous pouvez régler leurs durées et leurs prix."),
  ).toBeVisible();
  const sweeping = serviceRow(page, "Ramonage");
  await expect(sweeping).toBeVisible();
  await expect(sweeping).toContainText("1 h");
  await expect(sweeping).toContainText("Sur devis");
  await expect(sweeping).toContainText("Certificat de ramonage");

  await createService(page, { name: "Débistrage", duration: "1 h 30", price: "120" });
  await expect(serviceRow(page, "Débistrage")).toContainText("1 h 30");
  await expect(serviceRow(page, "Débistrage")).toContainText(/120\s€/);
  await expect(serviceRow(page, "Débistrage")).toContainText("Aucun document");

  await sweeping.click();
  const editor = page.getByRole("dialog", { name: "Modifier la prestation" });
  await expect(editor.getByLabel("Nom")).toHaveValue("Ramonage");
  await editor.getByLabel("Prix TTC").fill("80");
  await editor.getByRole("button", { name: "Enregistrer" }).click();
  await expect(
    page.getByText("Prestation enregistrée. Elle s'applique aux prochains passages."),
  ).toBeVisible();
  await expect(sweeping).toContainText(/80\s€/);

  await createService(page, { name: "Tubage", duration: "2 jours", price: "" });
  await expect(serviceRow(page, "Tubage")).toContainText("2 jours");
  await serviceRow(page, "Tubage").click();
  await page
    .getByRole("dialog", { name: "Modifier la prestation" })
    .getByRole("button", { name: "Retirer" })
    .click();
  await expect(
    page.getByText("Prestation retirée. Les passages déjà prévus la gardent."),
  ).toBeVisible();
  await expect(serviceRow(page, "Tubage")).toHaveCount(0);

  await page.reload();
  await expect(serviceRow(page, "Ramonage")).toContainText(/80\s€/);
  await expect(serviceRow(page, "Débistrage")).toBeVisible();
  await expect(serviceRow(page, "Tubage")).toHaveCount(0);
};

const chooseOption = async (page: Page, name: RegExp) => {
  await page.locator("label").filter({ hasText: name }).click();
  await expect(page.getByRole("checkbox", { name })).toBeChecked();
};

const planSharedVisit = async (page: Page) => {
  await page.goto("/planning/nouveau?jour=2030-03-12");
  await page.getByLabel("Client").fill("garn");
  await page.getByRole("button", { name: /Hélène Garnier/ }).click();

  const services = page.locator("#visit-services");
  await expect(services).toHaveText(/Choisir les prestations/);
  await services.click();
  await expect(page.getByRole("checkbox", { name: /^Tubage/ })).toHaveCount(0);
  await chooseOption(page, /^Ramonage/);
  await chooseOption(page, /^Débistrage/);
  await page.keyboard.press("Escape");
  await expect(services).toHaveText(/Ramonage, Débistrage/);

  const duration = page.getByRole("combobox", { name: "Durée" });
  await expect(duration).toHaveText("2 h 30");
  await expect(page.getByText("Ramonage 1 h + débistrage 1 h 30.")).toBeVisible();
  await expect(page.getByLabel("Prix annoncé")).toHaveValue(/^200\s€$/);

  const technicians = page.locator("#visit-technicians");
  await expect(technicians).toHaveText(/Jean Dupont/);
  await technicians.click();
  await chooseOption(page, /Marc Dupont/);
  await page.keyboard.press("Escape");
  await expect(technicians).toHaveText(/Jean Dupont.*Marc Dupont/);

  await page.getByLabel("Heure").fill("10:00");
  await page.getByRole("button", { name: "Ajouter au planning" }).last().click();
  await expect(page).toHaveURL(/\/planning\?jour=2030-03-12/);
};

test.describe("on a computer", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the owner sets up the company's services, then plans a visit with two services and two technicians", async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);
    const invitationLink = await onboardWithTechnician(page);
    const technicianContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const technician = await joinAsTechnician(technicianContext, invitationLink);

    await addCustomer(page);
    await setUpServices(page);
    await planSharedVisit(page);

    const visit = page.getByRole("link", { name: "Hélène Garnier, 10:00 – 12:30" });
    await expect(visit).toHaveCount(2);
    await visit.first().click();
    await expect(page.getByRole("heading", { name: "Hélène Garnier", level: 1 })).toBeVisible();
    await expect(
      page.getByRole("definition").filter({ hasText: "Ramonage, Débistrage · 2 h 30" }),
    ).toBeVisible();
    await expect(page.getByRole("term").filter({ hasText: "Techniciens" })).toBeVisible();
    await expect(
      page.getByRole("definition").filter({ hasText: "Jean Dupont, Marc Dupont" }),
    ).toBeVisible();

    await technician.goto("/planning?jour=2030-03-12");
    await expect(
      technician.getByRole("link", { name: "Hélène Garnier, 10:00 – 12:30" }),
    ).toBeVisible({ timeout: 15_000 });
    await technicianContext.close();
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 360, height: 760 } });

  test("the owner adds the services of his trade, then picks two of them on a new visit", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await createCompany(page, "prestations-mobile@example.fr");
    await page.getByRole("button", { name: "Plus tard" }).click();
    await expect(page.getByRole("heading", { name: "Bonjour Jean" })).toBeVisible();
    await addCustomer(page);

    await page.goto("/reglages/prestations");
    await expect(page.getByText("Aucune prestation", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ajouter les prestations de vos métiers" }).click();
    await expect(serviceRow(page, "Ramonage")).toContainText(
      "1 h · Sur devis · Certificat de ramonage",
    );

    await page.getByRole("button", { name: "Nouvelle prestation" }).first().click();
    const sheet = page.getByRole("dialog", { name: "Nouvelle prestation" });
    await sheet.getByLabel("Nom").fill("Débistrage");
    await sheet.getByLabel("Prix TTC").fill("120");
    await sheet.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Prestation ajoutée.")).toBeVisible();
    await expect(serviceRow(page, "Débistrage")).toContainText(/1 h · 120\s€ · Aucun document/);

    await page.goto("/planning/nouveau?jour=2030-03-12");
    await page.getByLabel("Client").fill("garn");
    await page.getByRole("button", { name: /Hélène Garnier/ }).click();
    await page.locator("#visit-services").click();
    const picker = page.getByRole("dialog", { name: "Prestations" });
    await chooseOption(page, /^Ramonage/);
    await chooseOption(page, /^Débistrage/);
    const confirm = picker.getByRole("button", { name: /^Valider · 2 h · 120\s€$/ });
    await expect(confirm).toBeVisible();
    await confirm.click();
    await expect(page.locator("#visit-services")).toHaveText(/Ramonage, Débistrage/);
    await expect(page.getByRole("combobox", { name: "Durée" })).toHaveText("2 h");
    await expect(page.getByLabel("Prix annoncé")).toHaveValue(/^120\s€$/);

    await page.getByLabel("Heure").fill("10:00");
    await page.getByRole("button", { name: "Ajouter au planning" }).last().click();
    await expect(page).toHaveURL(/\/planning\?jour=2030-03-12/);
    await expect(page.getByRole("link", { name: /Hélène Garnier, 10:00/ })).toBeVisible();
  });
});
