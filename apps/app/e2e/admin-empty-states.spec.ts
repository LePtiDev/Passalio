import type {
  AccountsPageResponse,
  ProspectCompaniesPageResponse,
  ProspectContactsPageResponse,
} from "@passalio/shared";
import { expect, test, type Browser, type ViewportSize } from "@playwright/test";
import { ADMIN_STATE_FILE, loadAdminScreenFixtures } from "./support/admin-screen-fixtures";
import { apiPathIs, respondWithJson } from "./support/api-stubs";
import { assignClientIp } from "./support/client-ip";
import { uniqueToken } from "./support/prospects";
import { VIEWPORTS } from "./support/viewports";

const NO_ACCOUNTS: AccountsPageResponse = {
  accounts: [],
  counts: { all: 0, trial: 0, dropping: 0 },
  nextCursor: null,
};

const NO_COMPANIES: ProspectCompaniesPageResponse = {
  companies: [],
  counts: {
    all: 0,
    to_qualify: 0,
    qualified: 0,
    interested: 0,
    demo_planned: 0,
    customer: 0,
    not_interested: 0,
  },
  nextCursor: null,
};

const NO_CONTACTS: ProspectContactsPageResponse = {
  contacts: [],
  counts: { all: 0, leaders: 0, no_phone: 0 },
  nextCursor: null,
};

const openStoredAdmin = async (
  browser: Browser,
  viewport: ViewportSize,
  permissions: readonly string[] = [],
) => {
  await loadAdminScreenFixtures(browser);
  const context = await browser.newContext({
    viewport,
    storageState: ADMIN_STATE_FILE,
    permissions: [...permissions],
  });
  await assignClientIp(context);
  const page = await context.newPage();
  return { context, page };
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("an empty customer accounts list offers to copy the sign-up link", async ({ browser }) => {
      const { context, page } = await openStoredAdmin(browser, size, [
        "clipboard-read",
        "clipboard-write",
      ]);
      await respondWithJson(page, apiPathIs("/admin/accounts"), NO_ACCOUNTS);

      await page.goto("/admin/comptes");
      await expect(page.getByRole("heading", { name: "Comptes clients", level: 1 })).toBeVisible();
      await expect(page.getByText("Aucune entreprise inscrite pour l'instant.")).toBeVisible();
      await page.getByRole("button", { name: "Copier le lien d'inscription" }).click();
      await expect(page.getByText("Lien d'inscription copié.")).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/inscription$/);
      await context.close();
    });

    test("an empty trial filter offers to show all the customer accounts", async ({ browser }) => {
      const { context, page } = await openStoredAdmin(browser, size);
      await respondWithJson(page, apiPathIs("/admin/accounts"), NO_ACCOUNTS);

      await page.goto("/admin/comptes?filtre=trial");
      await expect(page.getByRole("heading", { name: "Comptes clients", level: 1 })).toBeVisible();
      await expect(page.getByText("Aucune entreprise en essai.")).toBeVisible();
      await page.getByRole("button", { name: "Voir toutes les entreprises" }).click();
      await expect(page).not.toHaveURL(/filtre=trial/);
      await expect(page.getByText("Aucune entreprise inscrite pour l'instant.")).toBeVisible();
      await context.close();
    });

    test("an empty companies list offers to create the first company", async ({ browser }) => {
      const { context, page } = await openStoredAdmin(browser, size);
      await respondWithJson(page, apiPathIs("/admin/prospects/companies"), NO_COMPANIES);

      await page.goto("/admin/entreprises");
      await expect(page.getByRole("heading", { name: "Entreprises", level: 1 })).toBeVisible();
      await expect(page.getByText("Pas encore d'entreprise")).toBeVisible();
      await expect(page.getByText("Ajoutez un premier ramoneur à appeler.")).toBeVisible();
      await page
        .getByRole("main")
        .getByRole("button", { name: "Nouvelle entreprise" })
        .filter({ visible: true })
        .last()
        .click();
      await expect(page.getByRole("dialog", { name: "Nouvelle entreprise" })).toBeVisible();
      await context.close();
    });

    test("an empty stage tab offers to show all the companies", async ({ browser }) => {
      const { context, page } = await openStoredAdmin(browser, size);
      await respondWithJson(page, apiPathIs("/admin/prospects/companies"), NO_COMPANIES);

      await page.goto("/admin/entreprises?etape=demo_planned");
      await expect(page.getByRole("heading", { name: "Entreprises", level: 1 })).toBeVisible();
      await expect(page.getByText("Aucune entreprise à l'étape « Démo prévue »")).toBeVisible();
      await page.getByRole("button", { name: "Tout afficher" }).click();
      await expect(page).not.toHaveURL(/etape=/);
      await expect(page.getByText("Pas encore d'entreprise")).toBeVisible();
      await context.close();
    });

    test("an empty contacts list leads to the companies where contacts are added", async ({
      browser,
    }) => {
      const { context, page } = await openStoredAdmin(browser, size);
      await respondWithJson(page, apiPathIs("/admin/prospects/contacts"), NO_CONTACTS);

      await page.goto("/admin/contacts");
      await expect(page.getByRole("heading", { name: "Contacts", level: 1 })).toBeVisible();
      await expect(page.getByText("Pas encore de contact")).toBeVisible();
      await page.getByRole("main").getByRole("link", { name: "Entreprises" }).click();
      await expect(page).toHaveURL(/\/admin\/entreprises$/);
      await expect(page.getByRole("heading", { name: "Entreprises", level: 1 })).toBeVisible();
      await context.close();
    });

    test("an empty contacts tab offers to show all the contacts", async ({ browser }) => {
      const { context, page } = await openStoredAdmin(browser, size);
      await respondWithJson(page, apiPathIs("/admin/prospects/contacts"), NO_CONTACTS);

      await page.goto("/admin/contacts?onglet=leaders");
      await expect(page.getByRole("heading", { name: "Contacts", level: 1 })).toBeVisible();
      await expect(page.getByText("Aucun contact dans cet onglet")).toBeVisible();
      await page.getByRole("button", { name: "Tout afficher" }).click();
      await expect(page).not.toHaveURL(/onglet=leaders/);
      await expect(page.getByText("Pas encore de contact")).toBeVisible();
      await context.close();
    });

    test("a contacts search without result offers to clear the search", async ({ browser }) => {
      const { context, page } = await openStoredAdmin(browser, size);
      const search = `absent${uniqueToken()}`;

      await page.goto("/admin/contacts");
      await expect(page.getByRole("heading", { name: "Contacts", level: 1 })).toBeVisible();
      await page.getByLabel("Rechercher un contact").fill(search);
      await expect(page.getByText(`Aucun contact pour « ${search} »`)).toBeVisible();
      await page.getByRole("button", { name: "Effacer la recherche" }).click();
      await expect(page.getByLabel("Rechercher un contact")).toHaveValue("");
      await expect(page).not.toHaveURL(/recherche=/);
      await expect(page.getByRole("link", { name: /^Ouvrir / }).first()).toBeVisible();
      await context.close();
    });
  });
}
