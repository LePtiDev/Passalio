import {
  PATHS,
  publishedFeaturePages,
  publishedStories,
  publishedTargetPages,
} from "./content/catalog";
import { absoluteUrl } from "./seo";
import type { SiteEnvironment } from "./site-environment";

export const indexedPaths = (): ReadonlyArray<string> => [
  PATHS.home,
  ...publishedTargetPages().map((page) => PATHS.target(page.slug)),
  ...publishedFeaturePages().map((page) => PATHS.feature(page.slug)),
  PATHS.stories,
  PATHS.noNetwork,
  ...publishedStories().map((story) => PATHS.story(story.slug)),
];

export const sitemapXml = (environment: SiteEnvironment): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...indexedPaths().map((path) => `  <url><loc>${absoluteUrl(path, environment)}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");

export const robotsTxt = (environment: SiteEnvironment, isIndexed: boolean): string =>
  isIndexed
    ? `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl("/sitemap.xml", environment)}\n`
    : "User-agent: *\nDisallow: /\n";
