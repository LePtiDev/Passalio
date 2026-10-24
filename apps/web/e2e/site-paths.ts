import {
  PATHS,
  publishedFeaturePages,
  publishedStories,
  publishedTargetPages,
} from "../src/content/catalog";

export const SITE_PATHS: ReadonlyArray<string> = [
  PATHS.home,
  ...publishedTargetPages().map((page) => PATHS.target(page.slug)),
  ...publishedFeaturePages().map((page) => PATHS.feature(page.slug)),
  PATHS.stories,
  PATHS.noNetwork,
  ...publishedStories().map((story) => PATHS.story(story.slug)),
];
