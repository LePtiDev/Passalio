import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousAccessibilityViolations } from "./support/accessibility";
import { signUpAndOnboardOwner } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import { expectTouchTargetsAtLeast48px } from "./support/touch-targets";
import { DESKTOP, MOBILE } from "./support/viewports";

const required = (label: string) =>
  new RegExp(`^${label.replaceAll(/[()]/g, String.raw`\$&`)}\\*?$`);

const fillCompany = async (page: Page) => {
  await page.getByRole("combobox", { name: required("Forme juridique") }).click();
  await page.getByRole("option", { name: "SAS", exact: true }).click();
  await page.getByLabel(required("Capital social (€)")).fill("10 000");
  await page.getByRole("combobox", { name: required("Immatriculation") }).click();
  await page.getByRole("option", { name: "RCS (registre du commerce)" }).click();
  await page.getByLabel(required("Ville du greffe")).fill("Créteil");
  await page.getByLabel(required("Code APE")).fill("43.22b");
  await page.getByLabel(required("Adresse du siège")).fill("3 rue de Paris, 94000 Créteil");
};

test.beforeEach(async ({ context }) => {
  await assignClientIp(context);
});

test.describe("company and document settings on desktop", () => {
  test.use({ viewport: DESKTOP });

  test("the owner completes the legal mentions, then styles the certificate", async ({ page }) => {
    await signUpAndOnboardOwner(page, { companyName: "Ramonage Perrin" });
    await page.goto("/reglages");
    await page.getByRole("main").getByRole("link", { name: "Entreprise" }).click();

    await expect(page).toHaveURL(/\/reglages\/entreprise$/);
    await expect(page.getByText("À compléter avant votre premier certificat")).toBeVisible();
    await fillCompany(page);
    await expect(page.getByTestId("legal-line").last()).toHaveText(
      "Ramonage Perrin SAS au capital de 10 000 € · SIREN 123 456 789 RCS Créteil · siège : 3 rue de Paris, 94000 Créteil",
    );
    await expectNoSeriousAccessibilityViolations(page);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Réglages enregistrés.")).toBeVisible();
    await expect(page.getByText("À compléter avant votre premier certificat")).toHaveCount(0);

    await page.reload();
    await expect(page.getByLabel(required("Code APE"))).toHaveValue("4322B");

    await page.goto("/reglages/documents");
    const preview = page.getByRole("complementary").filter({ hasText: "Aperçu avec un exemple" });
    await expect(preview.getByRole("img", { name: "Page 1" })).toBeVisible({ timeout: 15_000 });
    await expect(preview.getByText("la page Entreprise")).toHaveCount(0);
    await page.getByText("Sobre", { exact: true }).click();
    await page.getByLabel("Pied de page").fill("Assurance RC Pro AXA n° 123456");
    await expect(page.getByText("2 changements non enregistrés")).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Réglages enregistrés.")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("radio", { name: /Sobre/ })).toBeChecked();
    await expect(page.getByLabel("Pied de page")).toHaveValue("Assurance RC Pro AXA n° 123456");
  });

  test("the next number is checked, previewed and saved", async ({ page }) => {
    await signUpAndOnboardOwner(page);
    await page.goto("/reglages/documents");

    const nextNumber = page.getByLabel(required("Prochain numéro"));
    await nextNumber.fill("0");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Indiquez un nombre entre 1 et 999 999.")).toBeVisible();

    await nextNumber.fill("25");
    await expect(page.getByText(/Prochain certificat : 2026-0025\./)).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Réglages enregistrés.")).toBeVisible();
  });
});

test.describe("company and document settings on mobile", () => {
  test.use({ viewport: MOBILE });

  test("the documents screen fits one hand and opens the preview full screen", async ({ page }) => {
    await signUpAndOnboardOwner(page);
    const tabBar = page.getByRole("navigation", { name: "Navigation principale" });
    await tabBar.getByRole("link", { name: "Réglages" }).click();
    await page.getByRole("main").getByRole("link", { name: "Documents" }).click();

    await expect(page).toHaveURL(/\/reglages\/documents$/);
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
    await expectTouchTargetsAtLeast48px(page);

    await page.getByRole("button", { name: "Aperçu" }).click();
    const sheet = page.getByRole("dialog", { name: "Aperçu" });
    await expect(sheet.getByRole("img", { name: "Page 1" })).toBeVisible({ timeout: 15_000 });
    await sheet.getByRole("tab", { name: "Page 2" }).click();
    await expect(sheet.getByRole("img", { name: "Page 2" })).toBeVisible();
    await sheet.getByRole("button", { name: "Revenir aux réglages" }).click();
    await expect(sheet).toHaveCount(0);

    await page.getByRole("link", { name: "Retour aux réglages" }).click();
    await expect(page).toHaveURL(/\/reglages$/);
    await page.getByRole("main").getByRole("link", { name: "Entreprise" }).click();
    await expect(page.getByLabel(required("Raison sociale"))).toBeVisible();
    await expectTouchTargetsAtLeast48px(page);
  });
});
