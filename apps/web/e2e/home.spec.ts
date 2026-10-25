import { expect, test } from "@playwright/test";
import { FEATURE_PAGES, PATHS, TARGET_PAGES } from "../src/content/catalog";
import { homeFr } from "../src/copy/home-fr";

test("the hero speaks to every trade and leads to a trial or a callback", async ({ page }) => {
  await page.goto(PATHS.home);
  await expect(page.locator("h1")).toHaveText(`${homeFr.hero.titleStart} ${homeFr.hero.titleEnd}`);
  await expect(page.getByText(homeFr.hero.lead)).toBeVisible();
  await expect(page.getByRole("link", { name: homeFr.hero.primary }).first()).toHaveAttribute(
    "href",
    /\/inscription$/,
  );

  await page.getByRole("link", { name: homeFr.hero.secondary }).click();
  await expect(page).toHaveURL(/#rappel$/);
  await expect(page.getByRole("textbox", { name: "Téléphone" })).toBeInViewport();
});

test("the product grid links every feature already in production", async ({ page }) => {
  await page.goto(PATHS.home);
  const grid = page.locator("#produit");
  const cardOf = (title: string) =>
    grid.getByRole("listitem").filter({ has: page.locator("h3", { hasText: title }) });
  const published = FEATURE_PAGES.filter((entry) => entry.isPublished);
  await Promise.all(
    published.flatMap((feature) => [
      expect(
        cardOf(feature.menu.title).getByRole("link", { name: feature.menu.title }),
      ).toHaveAttribute("href", PATHS.feature(feature.slug)),
      expect(cardOf(feature.menu.title).getByText(homeFr.product.soon)).toHaveCount(0),
    ]),
  );
});

test("the product grid marks features not yet in production as coming soon", async ({ page }) => {
  await page.goto(PATHS.home);
  const grid = page.locator("#produit");
  const upcoming = FEATURE_PAGES.filter((entry) => !entry.isPublished);
  expect(upcoming.length).toBeGreaterThan(0);
  const cardOf = (title: string) =>
    grid.getByRole("listitem").filter({ has: page.locator("h3", { hasText: title }) });
  await Promise.all(
    upcoming.flatMap((feature) => [
      expect(cardOf(feature.menu.title).getByRole("link")).toHaveCount(0),
      expect(cardOf(feature.menu.title).getByText(homeFr.product.soon)).toBeVisible(),
    ]),
  );
});

test("each published trade has its card", async ({ page }) => {
  await page.goto(PATHS.home);
  const section = page.locator("section", { hasText: homeFr.activities.title });
  await Promise.all(
    TARGET_PAGES.filter((entry) => entry.isPublished).map((target) =>
      expect(section.locator(`a[href="${PATHS.target(target.slug)}"]`)).toHaveCount(1),
    ),
  );
});

test("a trade page not yet published has no card", async ({ page }) => {
  await page.goto(PATHS.home);
  const section = page.locator("section", { hasText: homeFr.activities.title });
  const unpublished = TARGET_PAGES.filter((entry) => !entry.isPublished);
  expect(unpublished.length).toBeGreaterThan(0);
  await Promise.all(
    unpublished.map((target) =>
      expect(section.locator(`a[href="${PATHS.target(target.slug)}"]`)).toHaveCount(0),
    ),
  );
});
