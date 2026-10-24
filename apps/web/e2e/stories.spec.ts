import { expect, test } from "@playwright/test";

test("filters stories by activity", async ({ page }) => {
  await page.goto("/histoires");
  const cards = page.locator("[data-story-item]");
  const total = await cards.count();
  expect(total).toBeGreaterThan(1);

  await page.getByRole("button", { name: "Entreprise de ramonage" }).click();
  await expect(page.getByRole("button", { name: "Entreprise de ramonage" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(cards.filter({ visible: true })).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Trois techniciens, un seul planning" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Toutes" }).click();
  await expect(cards.filter({ visible: true })).toHaveCount(total);
});

test("tells the reader that people in a story are invented", async ({ page }) => {
  await page.goto("/histoires/trois-techniciens-un-planning");
  await expect(
    page.getByText("Les personnes et les entreprises sont inventées.", { exact: false }),
  ).toBeVisible();
});
