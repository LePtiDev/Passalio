import { expect, test } from "@playwright/test";
import { onboardCustomerOwner } from "./support/customer-account";
import { assignClientIp } from "./support/client-ip";
import { openAdminSession } from "./support/platform-admin";
import { inSequence } from "./support/sequence";
import { VIEWPORTS } from "./support/viewports";

const ADMIN_NAVIGATION = "Navigation de l'espace admin";

const PLATFORM_PATHS = ["/admin", "/admin/comptes", "/admin/journal", "/admin/equipe"] as const;

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("a customer who types /admin lands on the home page", async ({ page }) => {
      await assignClientIp(page.context());
      const owner = await onboardCustomerOwner(page, "Ramonage Hugo", { firstName: "Hugo" });

      await page.goto("/admin");

      await expect(page.getByRole("heading", { name: `Bonjour ${owner.firstName}` })).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("navigation", { name: ADMIN_NAVIGATION })).toHaveCount(0);

      await page.goto("/admin/comptes");
      await expect(page.getByRole("heading", { name: `Bonjour ${owner.firstName}` })).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
    });

    test("a signed-out visitor who types /admin is sent to the sign-in page", async ({ page }) => {
      await page.goto("/admin");

      await expect(page).toHaveURL(/\/connexion\?retour=/);
      await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
    });

    test("the sales role only sees the Commercial section", async ({ browser }) => {
      const { context, page } = await openAdminSession(browser, size, "sales");

      await expect(page).toHaveURL(/\/admin\/entreprises/);
      await expect(page.getByRole("heading", { name: "Entreprises" })).toBeVisible();
      const navigation = page.getByRole("navigation", { name: ADMIN_NAVIGATION });
      await expect(navigation.getByRole("link")).toHaveText([
        "Ma journée",
        "Appels",
        "Entreprises",
        "Contacts",
        "Prospection",
      ]);

      await inSequence(PLATFORM_PATHS, async (path) => {
        await page.goto(path);
        await expect(page).toHaveURL(/\/admin\/entreprises$/);
        await expect(page.getByRole("heading", { name: "Entreprises" })).toBeVisible();
      });
      await context.close();
    });

    test("the admin role sees the platform pages but not the Passalio team", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "admin");

      await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();
      const navigation = page.getByRole("navigation", { name: ADMIN_NAVIGATION });
      await expect(navigation.getByRole("link", { name: "Journal" })).toBeVisible();
      await expect(navigation.getByRole("link", { name: /Équipe/ })).toHaveCount(0);

      await page.goto("/admin/equipe");
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByRole("heading", { name: "Vue d'ensemble" })).toBeVisible();
      await context.close();
    });

    test("the super admin sees the Commercial, platform and Passalio team pages", async ({
      browser,
    }) => {
      const { context, page } = await openAdminSession(browser, size, "superadmin");

      const navigation = page.getByRole("navigation", { name: ADMIN_NAVIGATION });
      await expect(navigation.getByRole("link", { name: /Équipe/ })).toBeVisible();
      await navigation.getByRole("link", { name: /Équipe/ }).click();
      await expect(page).toHaveURL(/\/admin\/equipe$/);
      await expect(page.getByRole("heading", { name: "Équipe Passalio" })).toBeVisible();
      await context.close();
    });
  });
}
