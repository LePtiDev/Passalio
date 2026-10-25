import {
  PATHS,
  type StoryLink,
  publishedFeaturePages,
  publishedTargetPages,
  storyLinks,
} from "./content/catalog";
import type { MenuIcon } from "./content/content-schema";

export interface MenuEntry {
  href: string;
  title: string;
  text: string;
  icon: MenuIcon;
}

export const STORIES_IN_MENU = 3;

export const productMenu = (): ReadonlyArray<MenuEntry> =>
  publishedFeaturePages().map((page) => ({ href: PATHS.feature(page.slug), ...page.menu }));

export const activityMenu = (): ReadonlyArray<MenuEntry> =>
  publishedTargetPages().map((page) => ({ href: PATHS.target(page.slug), ...page.menu }));

export const storiesMenu = (): ReadonlyArray<StoryLink> => storyLinks().slice(0, STORIES_IN_MENU);
