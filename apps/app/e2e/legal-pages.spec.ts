import { expect, test } from "@playwright/test";

test("the sign-in footer leads to each legal page", async ({ page }) => {
  await page.goto("/connexion");
  const legalLinks = page.getByRole("navigation", { name: "Documents légaux" });

  await legalLinks.getByRole("link", { name: "Conditions" }).click();
  await expect(page).toHaveURL(/\/conditions$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Conditions générales d'utilisation et de vente" }),
  ).toBeVisible();

  await page.goto("/connexion");
  await legalLinks.getByRole("link", { name: "Confidentialité" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Politique de confidentialité" }),
  ).toBeVisible();

  await page.goto("/connexion");
  await legalLinks.getByRole("link", { name: "Mentions légales" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mentions légales" })).toBeVisible();
});

test("the sign-up terms link opens the conditions in a new tab", async ({ page, context }) => {
  await page.goto("/inscription");
  await page.getByLabel("Prénom").fill("Jean");

  const newTab = context.waitForEvent("page");
  await page.getByRole("link", { name: /conditions d'utilisation/ }).click();
  const conditions = await newTab;

  await expect(
    conditions.getByRole("heading", {
      level: 1,
      name: "Conditions générales d'utilisation et de vente",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Prénom")).toHaveValue("Jean");
  await expect(page.getByRole("checkbox", { name: /J'accepte les conditions/ })).not.toBeChecked();
});

test("the mobile table of contents opens and jumps to a section", async ({ page }) => {
  await page.goto("/conditions");
  await page.getByRole("button", { name: "Sommaire" }).click();
  await page.getByRole("link", { name: "7. Prix et paiement" }).click();
  await expect(page).toHaveURL(/#prix$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "7. Prix et paiement" }),
  ).toBeInViewport();
});
