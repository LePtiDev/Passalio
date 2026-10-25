import { type SiteEnvironment, SITE_ENVIRONMENT, siteOriginFor } from "./site-environment";

export type JsonLd = Readonly<Record<string, unknown>>;

export interface Crumb {
  name: string;
  path: string;
}

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const absoluteUrl = (
  path: string,
  environment: SiteEnvironment = SITE_ENVIRONMENT,
): string => new URL(path, siteOriginFor(environment)).toString();

export const ogImageName = (path: string): string =>
  path === "/" ? "accueil" : path.replace(/^\//, "").replaceAll("/", "-");

export const ogImagePath = (path: string): string => `/og/${ogImageName(path)}.png`;

const organizationId = (environment: SiteEnvironment): string =>
  `${absoluteUrl("/", environment)}#organisation`;

const organization = (environment: SiteEnvironment): JsonLd => ({
  "@type": "Organization",
  "@id": organizationId(environment),
  name: "Passalio",
  url: absoluteUrl("/", environment),
  logo: absoluteUrl("/apple-touch-icon.png", environment),
});

export const organizationJsonLd = (environment: SiteEnvironment = SITE_ENVIRONMENT): JsonLd => ({
  "@context": "https://schema.org",
  ...organization(environment),
});

export const websiteJsonLd = (environment: SiteEnvironment = SITE_ENVIRONMENT): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Passalio",
  url: absoluteUrl("/", environment),
  inLanguage: "fr-FR",
  publisher: { "@id": organizationId(environment) },
});

export const softwareJsonLd = (
  description: string,
  environment: SiteEnvironment = SITE_ENVIRONMENT,
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Passalio",
  description,
  applicationCategory: "BusinessApplication",
  operatingSystem: "iOS, Android, Web",
  url: absoluteUrl("/", environment),
  publisher: { "@id": organizationId(environment) },
});

export const breadcrumbJsonLd = (
  crumbs: ReadonlyArray<Crumb>,
  environment: SiteEnvironment = SITE_ENVIRONMENT,
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: absoluteUrl(crumb.path, environment),
  })),
});

export const faqJsonLd = (
  questions: ReadonlyArray<{ question: string; answer: string }>,
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: questions.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
});

export const articleJsonLd = (
  article: { title: string; description: string; path: string; publishedOn: string },
  environment: SiteEnvironment = SITE_ENVIRONMENT,
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: article.title,
  description: article.description,
  datePublished: article.publishedOn,
  inLanguage: "fr-FR",
  mainEntityOfPage: absoluteUrl(article.path, environment),
  image: absoluteUrl(ogImagePath(article.path), environment),
  author: { "@type": "Organization", name: "Passalio", url: absoluteUrl("/", environment) },
  publisher: organization(environment),
});

export const serializeJsonLd = (data: JsonLd): string =>
  JSON.stringify(data).replaceAll("<", "\\u003c");
