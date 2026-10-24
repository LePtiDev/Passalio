import { describe, expect, it } from "vitest";
import { FEATURE_PAGES, TARGET_PAGES } from "./content/catalog";
import { STORIES_IN_MENU, activityMenu, productMenu, storiesMenu } from "./navigation";

describe("navigation menus", () => {
  it("shows only published feature pages in Produit", () => {
    const hrefs = productMenu().map((entry) => entry.href);
    expect(hrefs).toEqual(
      FEATURE_PAGES.filter((page) => page.isPublished).map((page) => `/produit/${page.slug}`),
    );
    expect(hrefs).not.toContain("/produit/relances");
  });

  it("shows only published target pages in Activité", () => {
    expect(activityMenu().map((entry) => entry.href)).toEqual(
      TARGET_PAGES.filter((page) => page.isPublished).map((page) => `/activite/${page.slug}`),
    );
  });

  it("shows at most three stories", () => {
    expect(storiesMenu().length).toBeLessThanOrEqual(STORIES_IN_MENU);
    expect(storiesMenu()[0]?.href).toBe("/sans-reseau");
  });
});
