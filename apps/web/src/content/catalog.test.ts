import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ogImagePath } from "../seo";
import { indexedPaths } from "../sitemap";
import { noNetworkCampaign } from "./campaigns/no-network";
import {
  FEATURE_PAGES,
  PATHS,
  STORIES,
  TARGET_PAGES,
  featureLinksFor,
  publishedFeaturePages,
  publishedStories,
  publishedTargetPages,
  relatedStoryLinks,
  storyLinks,
} from "./catalog";

const PLACEHOLDER = /\[[^\]]+\]/;

const textsOf = (value: unknown): ReadonlyArray<string> => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(textsOf);
  if (value !== null && typeof value === "object") return Object.values(value).flatMap(textsOf);
  return [];
};

const publishedEntries = [
  ...publishedTargetPages(),
  ...publishedFeaturePages(),
  ...publishedStories(),
  noNetworkCampaign,
];

describe("site content", () => {
  it("keeps every slug unique within its section", () => {
    for (const entries of [TARGET_PAGES, FEATURE_PAGES, STORIES]) {
      const slugs = entries.map((entry) => entry.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("never publishes a text still waiting for an answer between brackets", () => {
    const placeholders = publishedEntries.flatMap((entry) =>
      textsOf(entry).filter((text) => PLACEHOLDER.test(text)),
    );
    expect(placeholders).toEqual([]);
  });

  it("keeps features that are not in production off the site", () => {
    const unpublished = FEATURE_PAGES.filter((page) => !page.isPublished).map((page) => page.slug);
    expect(unpublished).toEqual(["attestation-entretien", "relances", "lecture-de-plaque"]);
    expect(indexedPaths()).not.toContain(PATHS.feature("relances"));
  });

  it("gives each indexed page its own title and description", () => {
    const seo = publishedEntries.map((entry) => entry.seo);
    expect(new Set(seo.map((item) => item.title)).size).toBe(seo.length);
    expect(new Set(seo.map((item) => item.description)).size).toBe(seo.length);
    for (const item of seo) {
      expect(item.title.length).toBeLessThanOrEqual(60);
      expect(item.description.length).toBeGreaterThanOrEqual(70);
      expect(item.description.length).toBeLessThanOrEqual(160);
    }
  });

  it("points stories only to features and stories that exist", () => {
    const featureSlugs = new Set(FEATURE_PAGES.map((page) => page.slug));
    const storySlugs = new Set([noNetworkCampaign.slug, ...STORIES.map((story) => story.slug)]);
    for (const story of STORIES) {
      expect(story.featureSlugs.every((slug) => featureSlugs.has(slug))).toBe(true);
      expect(story.relatedSlugs.every((slug) => storySlugs.has(slug))).toBe(true);
    }
  });

  it("links a story only to published features and published stories", () => {
    for (const story of publishedStories()) {
      for (const link of featureLinksFor(story)) {
        const page = FEATURE_PAGES.find((candidate) => candidate.menu.title === link.title);
        expect(link.href === undefined).toBe(page?.isPublished !== true);
      }
      const published = new Set(storyLinks().map((link) => link.slug));
      expect(relatedStoryLinks(story).every((link) => published.has(link.slug))).toBe(true);
    }
  });

  it("lists the campaign page first among the stories", () => {
    expect(storyLinks()[0]?.href).toBe("/sans-reseau");
  });

  it("has a share image for every indexed page", () => {
    const missing = indexedPaths().filter(
      (path) => !existsSync(new URL(`../../public${ogImagePath(path)}`, import.meta.url)),
    );
    expect(missing).toEqual([]);
  });
});
