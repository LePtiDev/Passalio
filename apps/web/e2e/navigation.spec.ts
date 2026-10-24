import { expect, test } from "@playwright/test";

test.describe("desktop navigation", () => {
  test.skip(({ isMobile, viewport }) => isMobile || (viewport?.width ?? 0) < 1024, "desktop menu");

  test("opens a menu by click, closes it with Escape and leads to a page", async ({ page }) => {
    await page.goto("/");
    const product = page.getByRole("button", { name: "Produit" });
    await product.click();
    await expect(product).toHaveAttribute("aria-expanded", "true");
    const panel = page.locator("#menu-produit");
    await expect(panel).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(product).toBeFocused();

    await page.getByRole("button", { name: "Activité" }).click();
    await page
      .locator("#menu-activite")
      .getByRole("link", { name: /Entreprise de ramonage/ })
      .click();
    await expect(page).toHaveURL(/\/activite\/entreprise-de-ramonage$/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("opens a menu on hover and switches to another one", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Histoires" }).hover();
    await expect(page.locator("#menu-histoires")).toBeVisible();
    await page.getByRole("button", { name: "Produit" }).hover();
    await expect(page.locator("#menu-histoires")).toBeHidden();
    await expect(page.locator("#menu-produit")).toBeVisible();
  });

  test("closes the open menu when clicking elsewhere", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Produit" }).click();
    await page.locator("main").click({ position: { x: 10, y: 400 } });
    await expect(page.locator("#menu-produit")).toBeHidden();
  });
});

test.describe("mobile navigation", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 1024, "mobile menu");

  test("opens the full screen menu and reaches a feature page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    const menu = page.locator("#menu-mobile");
    await expect(menu).toBeVisible();
    await menu.getByText("Produit", { exact: true }).click();
    await menu.getByRole("link", { name: /Hors ligne/ }).click();
    await expect(page).toHaveURL(/\/produit\/hors-ligne$/);
  });

  test("closes the menu with its close button", async ({ page }) => {
    await page.goto("/histoires");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page.getByRole("button", { name: "Fermer le menu" }).click();
    await expect(page.locator("#menu-mobile")).toBeHidden();
  });

  test("keeps every link and button at least 48 pixels high", async ({ page }) => {
    await page.goto("/activite/ramoneur-independant");
    const small = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll("main a, main button, header a, header button, footer a"),
      )
        .filter((element) => element.getClientRects().length > 0)
        .filter((element) => !element.closest("[hidden], dialog:not([open])"))
        .filter((element) => !element.closest("p, dd, li span"))
        .filter((element) => element.getBoundingClientRect().height < 48)
        .map((element) => element.textContent?.trim()),
    );
    expect(small).toEqual([]);
  });
});
