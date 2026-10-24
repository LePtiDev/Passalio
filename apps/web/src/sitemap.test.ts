import { describe, expect, it } from "vitest";
import { indexedPaths, robotsTxt, sitemapXml } from "./sitemap";

describe("sitemap and robots", () => {
  it("lists the home page, published pages and stories", () => {
    expect(indexedPaths()).toEqual(
      expect.arrayContaining([
        "/",
        "/activite/ramoneur-independant",
        "/produit/hors-ligne",
        "/histoires",
        "/sans-reseau",
        "/histoires/trois-techniciens-un-planning",
      ]),
    );
  });

  it("leaves out pages whose feature is not in production", () => {
    expect(indexedPaths()).not.toContain("/produit/certificat-de-ramonage");
    expect(indexedPaths()).not.toContain("/activite/changer-de-logiciel");
    expect(indexedPaths()).not.toContain("/histoires/plaque-derriere-le-poele");
  });

  it("writes absolute urls for the environment", () => {
    expect(sitemapXml("production")).toContain(
      "<loc>https://passalio.com/produit/hors-ligne</loc>",
    );
    expect(sitemapXml("staging")).toContain("<loc>https://staging.passalio.com/</loc>");
  });

  it("opens production to crawlers and closes staging", () => {
    expect(robotsTxt("production", true)).toContain("Sitemap: https://passalio.com/sitemap.xml");
    expect(robotsTxt("staging", false)).toBe("User-agent: *\nDisallow: /\n");
  });
});
