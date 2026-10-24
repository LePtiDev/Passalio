import { expect, test, type Browser } from "@playwright/test";
import { onboardCustomerInNewContext } from "./support/customer-account";
import { openAdminSession } from "./support/platform-admin";
import { VIEWPORTS } from "./support/viewports";

const uniqueToken = () => crypto.randomUUID().replaceAll("-", "").slice(0, 10);

const onboardCustomer = (browser: Browser, companyName: string) =>
  onboardCustomerInNewContext(browser, companyName, { firstName: "Louise", lastName: "Martin" });

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("the overview shows the customer accounts, trials, active people and dropping usage", async ({
      browser,
    }) => {
      await onboardCustomer(browser, `Ramonage Vue ${uniqueToken()}`);
      const { context, page } = await openAdminSession(browser, size, "superadmin");

      const main = page.getByRole("main");
      await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();
      await expect(main.getByRole("link", { name: /^Comptes clients \d+/ })).toBeVisible();
      await expect(main.getByRole("link", { name: /^En essai \d+/ })).toBeVisible();
      await expect(main.getByText("Personnes actives", { exact: true })).toBeVisible();
      await expect(main.getByText("sur les 30 derniers jours", { exact: true })).toBeVisible();
      await expect(main.getByRole("link", { name: /^Utilisation en baisse \d+/ })).toBeVisible();
      await expect(main.getByRole("region", { name: "Essais qui se terminent" })).toBeVisible();

      await main.getByRole("link", { name: /^En essai \d+/ }).click();
      await expect(page).toHaveURL(/\/admin\/comptes\?filtre=trial/);
      await expect(page.getByRole("heading", { name: "Comptes clients" })).toBeVisible();
      await context.close();
    });

    test("an admin searches the customer accounts and filters them by trial and dropping usage", async ({
      browser,
    }) => {
      const token = uniqueToken();
      const companyName = `Ramonage Liste ${token}`;
      await onboardCustomer(browser, companyName);
      const { context, page } = await openAdminSession(browser, size, "admin");

      await page.goto("/admin/comptes");
      await expect(page.getByRole("heading", { name: "Comptes clients" })).toBeVisible();
      await page.getByLabel("Rechercher une entreprise").fill(token);
      await expect(page).toHaveURL(new RegExp(`recherche=${token}`));
      const row = page.getByRole("link", { name: `Ouvrir ${companyName}` });
      await expect(row).toBeVisible();
      await expect(page.getByRole("link", { name: /^Ouvrir / })).toHaveCount(1);

      await page.getByRole("button", { name: /En essai/ }).click();
      await expect(page).toHaveURL(/filtre=trial/);
      await expect(page.getByRole("button", { name: /En essai/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(row).toBeVisible();

      await page.getByRole("button", { name: /En baisse|Utilisation en baisse/ }).click();
      await expect(page).toHaveURL(/filtre=dropping/);
      await expect(row).toHaveCount(0);

      await page.getByRole("button", { name: /Toutes/ }).click();
      await expect(row).toBeVisible();

      await page.getByLabel("Rechercher une entreprise").fill(`absente ${token}`);
      await expect(page.getByText(`Aucune entreprise pour « absente ${token} »`)).toBeVisible();
      await page.getByRole("button", { name: "Effacer la recherche" }).click();
      await expect(page.getByLabel("Rechercher une entreprise")).toHaveValue("");
      await expect(page.getByRole("link", { name: /^Ouvrir / }).first()).toBeVisible();
      await context.close();
    });

    test("an account file shows its people, usage and journal tabs", async ({ browser }) => {
      const token = uniqueToken();
      const companyName = `Ramonage Fiche ${token}`;
      await onboardCustomer(browser, companyName);
      const { context, page } = await openAdminSession(browser, size, "superadmin");

      await page.goto(`/admin/comptes?recherche=${token}`);
      await page.getByRole("link", { name: `Ouvrir ${companyName}` }).click();
      await expect(page).toHaveURL(/\/admin\/comptes\/[^/?]+$/);
      await expect(page.getByRole("heading", { name: companyName, level: 1 })).toBeVisible();

      const tabs = page.getByRole("tablist", { name: "Sections de la fiche" });
      await expect(tabs.getByRole("tab", { name: /Personnel/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(page.getByRole("tabpanel").getByText("Louise Martin")).toBeVisible();

      await tabs.getByRole("tab", { name: /Utilisation/ }).click();
      await expect(page).toHaveURL(/onglet=utilisation/);
      await expect(
        page.getByText("Une connexion compte un jour où la personne a utilisé Passalio."),
      ).toBeVisible();

      await tabs.getByRole("tab", { name: /Journal/ }).click();
      await expect(page).toHaveURL(/onglet=journal/);
      await expect(page.getByRole("tabpanel").getByText(/a créé l'entreprise/)).toBeVisible();

      await page.reload();
      await expect(tabs.getByRole("tab", { name: /Journal/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await context.close();
    });

    test("the journal lists what happened on the customer accounts", async ({ browser }) => {
      const companyName = `Ramonage Journal ${uniqueToken()}`;
      await onboardCustomer(browser, companyName);
      const { context, page } = await openAdminSession(browser, size, "superadmin");

      await page
        .getByRole("navigation", { name: "Navigation de l'espace admin" })
        .getByRole("link", { name: "Journal" })
        .click();
      await expect(page).toHaveURL(/\/admin\/journal$/);
      await expect(page.getByRole("heading", { name: "Journal" })).toBeVisible();
      const entry = page
        .getByRole("listitem")
        .filter({ hasText: new RegExp(`Louise Martin a créé l'entreprise ${companyName}`) });
      await expect(entry).toBeVisible();
      await entry.getByRole("link", { name: companyName }).click();
      await expect(page).toHaveURL(/\/admin\/comptes\/[^/?]+/);
      await expect(page.getByRole("heading", { name: companyName, level: 1 })).toBeVisible();
      await context.close();
    });
  });
}

test.describe("on desktop", () => {
  test.use({ viewport: VIEWPORTS[1].size });

  test("the overview lists the latest movements with a link to the account", async ({
    browser,
  }) => {
    const companyName = `Ramonage Mouvement ${uniqueToken()}`;
    await onboardCustomer(browser, companyName);
    const { context, page } = await openAdminSession(browser, VIEWPORTS[1].size, "superadmin");

    const movements = page.getByRole("region", { name: "Derniers mouvements" });
    await expect(movements).toBeVisible();
    await movements.getByRole("link", { name: companyName }).first().click();
    await expect(page).toHaveURL(/\/admin\/comptes\/[^/?]+/);
    await expect(page.getByRole("heading", { name: companyName, level: 1 })).toBeVisible();
    await context.close();
  });
});
