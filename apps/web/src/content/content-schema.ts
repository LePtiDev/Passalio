import { z } from "zod";

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const toneSchema = z.enum(["validated", "warning", "neutral"]);
export const menuIconSchema = z.enum([
  "document",
  "flame",
  "calendar",
  "offline",
  "bell",
  "home",
  "camera",
  "users",
  "user",
  "wrench",
  "swap",
]);
export const coverThemeSchema = z.enum(["navy", "mint", "amber"]);

const statusSchema = z.object({ label: text, tone: toneSchema });

const rowSchema = z.object({ label: text, value: z.string(), tag: text.optional() });

export const seoSchema = z.object({
  title: z.string().min(20).max(60),
  description: z.string().min(70).max(160),
});

export const appScreenSchema = z.object({
  backLabel: text,
  status: statusSchema,
  title: text,
  subtitle: z.string(),
  rows: z.array(rowSchema).min(1).max(5),
  action: text,
});

export const visualCardSchema = z.object({
  title: text,
  subtitle: z.string(),
  status: statusSchema.optional(),
  rows: z.array(rowSchema).min(1).max(4),
});

const questionSchema = z.object({ question: text, answer: text });

const menuEntrySchema = z.object({ title: text, text: text, icon: menuIconSchema });

export const marketingPageSchema = z.object({
  slug,
  isPublished: z.boolean(),
  seo: seoSchema,
  menu: menuEntrySchema,
  eyebrow: text,
  title: text,
  lead: text,
  highlights: z.array(text).min(1).max(3),
  screen: appScreenSchema,
  pains: z.array(z.object({ title: text, text: text })).length(3),
  featuresTitle: text,
  features: z
    .array(
      z.object({
        label: text,
        title: text,
        text: text,
        bullets: z.array(text).min(1).max(4),
        visual: visualCardSchema,
      }),
    )
    .min(3)
    .max(4),
  questions: z.array(questionSchema).min(1),
  finalTitle: text,
});

const storyCardSchema = z.object({
  moment: text,
  quote: text,
  theme: coverThemeSchema,
  title: text,
  summary: text,
  activity: text,
  minutes: z.number().int().positive(),
});

export const storySchema = z.object({
  slug,
  isPublished: z.boolean(),
  publishedOn: z.iso.date(),
  seo: seoSchema,
  card: storyCardSchema,
  featureSlugs: z.array(slug).min(1),
  title: text,
  lead: text,
  character: z.object({ initial: z.string().length(1), name: text, role: text }),
  sections: z
    .array(
      z.object({
        heading: text,
        paragraphs: z.array(text).min(1),
        quote: z.object({ text: text, author: text }).optional(),
      }),
    )
    .min(2),
  before: z.array(text).min(2),
  after: z.array(text).min(2),
  visual: visualCardSchema,
  callToAction: text,
  relatedSlugs: z.array(slug).min(1),
});

export type Tone = z.infer<typeof toneSchema>;
export type MenuIcon = z.infer<typeof menuIconSchema>;
export type CoverTheme = z.infer<typeof coverThemeSchema>;
export type AppScreen = z.infer<typeof appScreenSchema>;
export type VisualCard = z.infer<typeof visualCardSchema>;
export type Seo = z.infer<typeof seoSchema>;
export type MarketingPage = z.infer<typeof marketingPageSchema>;
export type MarketingPageInput = z.input<typeof marketingPageSchema>;
export type Story = z.infer<typeof storySchema>;
export type StoryInput = z.input<typeof storySchema>;
export type StoryCard = z.infer<typeof storyCardSchema>;
