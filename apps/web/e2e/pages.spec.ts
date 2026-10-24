import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { SITE_PATHS } from "./site-paths";

for (const path of SITE_PATHS) {
  test(`${path} is complete for visitors, search engines and link previews`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new URL(path, "https://passalio.com").toString(),
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{70,}/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /^https:\/\/passalio\.com\/og\/.+\.png$/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );

    const structuredData = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(structuredData.length).toBeGreaterThan(0);
    for (const data of structuredData) {
      expect(JSON.parse(data)).toHaveProperty("@context", "https://schema.org");
    }

    const imagePath = new URL(
      (await page.locator('meta[property="og:image"]').getAttribute("content")) ?? "",
    ).pathname;
    expect((await page.request.get(imagePath)).status()).toBe(200);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("the sitemap and robots.txt point crawlers to the indexed pages", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of SITE_PATHS) {
    expect(sitemap).toContain(`<loc>${new URL(path, "https://passalio.com").toString()}</loc>`);
  }
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Sitemap: https://passalio.com/sitemap.xml",
  );
});

test("a feature that is not in production has no page", async ({ request }) => {
  expect((await request.get("/produit/relances")).status()).toBe(404);
});

test("an unknown address shows a page that leads back home", async ({ page }) => {
  const response = await page.goto("/page-qui-n-existe-pas");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Cette page n’existe pas." })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await page.getByRole("link", { name: "Retour à l’accueil" }).click();
  await expect(page).toHaveURL(/\/$/);
});
