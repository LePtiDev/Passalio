import { expect, test, type Page } from "@playwright/test";
import { signUpAndOnboardOwner } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import { DESKTOP, MOBILE } from "./support/viewports";

const expectSettingsScreen = async (page: Page, email: string) => {
  await expect(page).toHaveURL(/\/reglages$/);
  await expect(page.getByRole("heading", { name: "Réglages" })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByText("Connecté en tant que")).toBeVisible();
  await expect(main.getByText(email)).toBeVisible();
  await expect(main.getByRole("link", { name: "Équipe" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Entreprise" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Documents" })).toBeVisible();
  await expect(main.getByText("Abonnement")).toBeVisible();
  await expect(main.getByText("Bientôt")).toHaveCount(1);
  await expect(main.getByRole("link", { name: "Abonnement" })).toHaveCount(0);
};

test.beforeEach(async ({ context }) => {
  await assignClientIp(context);
});

test.describe("settings on mobile", () => {
  test.use({ viewport: MOBILE });

  test("the settings tab shows the signed-in address and leads to the team", async ({ page }) => {
    const owner = await signUpAndOnboardOwner(page, { companyName: "Ramonage Perrin" });
    const tabBar = page.getByRole("navigation", { name: "Navigation principale" });
    await tabBar.getByRole("link", { name: "Réglages" }).click();
    await expectSettingsScreen(page, owner.email);
    await expect(tabBar.getByRole("link", { name: "Réglages" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByRole("main").getByRole("link", { name: "Équipe" }).click();
    await expect(page).toHaveURL(/\/equipe$/);
    await expect(page.getByRole("heading", { name: "Équipe" })).toBeVisible();
    await expect(tabBar.getByRole("link", { name: "Réglages" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.getByRole("link", { name: "Retour aux réglages" }).click();
    await expectSettingsScreen(page, owner.email);
  });
});

test.describe("settings on desktop", () => {
  test.use({ viewport: DESKTOP });

  test("the settings screen shows the signed-in address and leads to the team", async ({
    page,
  }) => {
    const owner = await signUpAndOnboardOwner(page, { companyName: "Ramonage Perrin" });
    await page.goto("/reglages");
    await expectSettingsScreen(page, owner.email);
    await expect(page.getByRole("navigation", { name: "Fil d'Ariane" })).toContainText("Réglages");

    await page.getByRole("main").getByRole("link", { name: "Équipe" }).click();
    await expect(page).toHaveURL(/\/equipe$/);
    await expect(page.getByRole("heading", { name: "Équipe" })).toBeVisible();
    await page
      .getByRole("navigation", { name: "Fil d'Ariane" })
      .getByRole("link", { name: "Réglages" })
      .click();
    await expectSettingsScreen(page, owner.email);
  });

  test("the sidebar sign-out button signs the user out", async ({ page }) => {
    await signUpAndOnboardOwner(page, { companyName: "Ramonage Perrin" });
    await page.getByRole("complementary").getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/connexion/);
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();

    await page.goto("/reglages");
    await expect(page).toHaveURL(/\/connexion\?retour=%2Freglages/);
  });
});
