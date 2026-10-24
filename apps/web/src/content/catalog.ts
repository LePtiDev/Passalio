import { noNetworkCampaign } from "./campaigns/no-network";
import {
  type MarketingPage,
  type Story,
  type StoryCard,
  marketingPageSchema,
  storySchema,
} from "./content-schema";
import { certificatePage } from "./features/certificate";
import { customerFilesPage } from "./features/customer-files";
import { maintenanceCertificatePage } from "./features/maintenance-certificate";
import { offlinePage } from "./features/offline";
import { planningPage } from "./features/planning";
import { plateReadingPage } from "./features/plate-reading";
import { remindersPage } from "./features/reminders";
import { teamPage } from "./features/team";
import { betweenBoilersStory } from "./stories/between-boilers";
import { customerTakeoverStory } from "./stories/customer-takeover";
import { hiddenPlateStory } from "./stories/hidden-plate";
import { insurerRequestStory } from "./stories/insurer-request";
import { missedCallsStory } from "./stories/missed-calls";
import { sharedPlanningStory } from "./stories/shared-planning";
import { twoDocumentsStory } from "./stories/two-documents";
import { heatingEngineersPage } from "./targets/heating-engineers";
import { independentSweepPage } from "./targets/independent-sweep";
import { softwareSwitchPage } from "./targets/software-switch";
import { stoveInstallersPage } from "./targets/stove-installers";
import { sweepingCompanyPage } from "./targets/sweeping-company";

export const TARGET_PAGES: ReadonlyArray<MarketingPage> = [
  independentSweepPage,
  sweepingCompanyPage,
  stoveInstallersPage,
  heatingEngineersPage,
  softwareSwitchPage,
].map((page) => marketingPageSchema.parse(page));

export const FEATURE_PAGES: ReadonlyArray<MarketingPage> = [
  certificatePage,
  maintenanceCertificatePage,
  planningPage,
  offlinePage,
  remindersPage,
  customerFilesPage,
  plateReadingPage,
  teamPage,
].map((page) => marketingPageSchema.parse(page));

export const STORIES: ReadonlyArray<Story> = [
  insurerRequestStory,
  missedCallsStory,
  hiddenPlateStory,
  twoDocumentsStory,
  sharedPlanningStory,
  betweenBoilersStory,
  customerTakeoverStory,
].map((story) => storySchema.parse(story));

export const PATHS = {
  home: "/",
  stories: "/histoires",
  noNetwork: `/${noNetworkCampaign.slug}`,
  target: (slug: string) => `/activite/${slug}`,
  feature: (slug: string) => `/produit/${slug}`,
  story: (slug: string) => `/histoires/${slug}`,
} as const;

const isPublished = (entry: { isPublished: boolean }): boolean => entry.isPublished;

export const publishedTargetPages = (): ReadonlyArray<MarketingPage> =>
  TARGET_PAGES.filter(isPublished);

export const publishedFeaturePages = (): ReadonlyArray<MarketingPage> =>
  FEATURE_PAGES.filter(isPublished);

export const publishedStories = (): ReadonlyArray<Story> => STORIES.filter(isPublished);

export interface StoryLink {
  slug: string;
  href: string;
  card: StoryCard;
}

export const storyLinks = (): ReadonlyArray<StoryLink> => [
  { slug: noNetworkCampaign.slug, href: PATHS.noNetwork, card: noNetworkCampaign.card },
  ...publishedStories().map((story) => ({
    slug: story.slug,
    href: PATHS.story(story.slug),
    card: story.card,
  })),
];

export const relatedStoryLinks = (story: Story): ReadonlyArray<StoryLink> =>
  story.relatedSlugs.flatMap((slug) => storyLinks().filter((link) => link.slug === slug));

export const featureLinksFor = (
  story: Story,
): ReadonlyArray<{ title: string; href: string | undefined }> =>
  story.featureSlugs.flatMap((slug) =>
    FEATURE_PAGES.filter((page) => page.slug === slug).map((page) => ({
      title: page.menu.title,
      href: page.isPublished ? PATHS.feature(page.slug) : undefined,
    })),
  );
