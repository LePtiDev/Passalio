import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./support/accounts";

const SLOW_SESSION_MS = 3000;

const slowDownSessionChecks = (page: Page) =>
  page.route("**/api/auth/get-session**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SLOW_SESSION_MS));
    await route.continue();
  });

const organizationSaved = (page: Page) =>
  page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" && response.url().endsWith("/api/organization"),
  );

const enabledContinueOf = (page: Page, stepTitle: string) =>
  page
    .locator("form", { has: page.getByRole("heading", { name: stepTitle }) })
    .getByRole("button", { name: "Continuer", disabled: false });

const reachTradesStep = async (page: Page) => {
  await signUp(page);
  await expect(page).toHaveURL(/\/configuration\/entreprise/);
  await page.getByLabel("Nom affiché sur les documents").fill("Ramonage Dupont");
  await page.getByLabel("SIRET").fill("123 456 789 00012");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/configuration\/metiers/);
  await page.getByText("Ramonage", { exact: true }).click();
};

test("the trades step cannot be sent again while the documents step is loading", async ({
  page,
}) => {
  await reachTradesStep(page);
  await slowDownSessionChecks(page);
  const saved = organizationSaved(page);

  await page.getByRole("button", { name: "Continuer" }).click();
  await saved;
  await expect(page).toHaveURL(/\/configuration\/documents/);

  expect(await enabledContinueOf(page, "Vos métiers").count()).toBe(0);
});

test("the documents step cannot be sent again while the team step is loading", async ({ page }) => {
  await reachTradesStep(page);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { name: "Vos documents" })).toBeVisible();
  await slowDownSessionChecks(page);
  const saved = organizationSaved(page);

  await page.getByRole("button", { name: "Continuer" }).click();
  await saved;
  await expect(page).toHaveURL(/\/configuration\/equipe/);

  expect(await enabledContinueOf(page, "Vos documents").count()).toBe(0);
});
