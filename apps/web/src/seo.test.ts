import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  ogImagePath,
  serializeJsonLd,
} from "./seo";

describe("seo", () => {
  it("builds absolute urls on the production or staging site", () => {
    expect(absoluteUrl("/")).toBe("https://passalio.com/");
    expect(absoluteUrl("/produit/hors-ligne")).toBe("https://passalio.com/produit/hors-ligne");
    expect(absoluteUrl("/histoires", "staging")).toBe("https://staging.passalio.com/histoires");
  });

  it("names the share image after the page path", () => {
    expect(ogImagePath("/")).toBe("/og/accueil.png");
    expect(ogImagePath("/activite/ramoneur-independant")).toBe(
      "/og/activite-ramoneur-independant.png",
    );
  });

  it("numbers breadcrumb items from one with absolute urls", () => {
    expect(
      breadcrumbJsonLd([
        { name: "Accueil", path: "/" },
        { name: "Histoires", path: "/histoires" },
      ]),
    ).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        { position: 1, name: "Accueil", item: "https://passalio.com/" },
        { position: 2, name: "Histoires", item: "https://passalio.com/histoires" },
      ],
    });
  });

  it("describes questions and answers for search engines", () => {
    expect(faqJsonLd([{ question: "Q ?", answer: "R." }])).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "Q ?", acceptedAnswer: { text: "R." } }],
    });
  });

  it("describes a story as an article with its image and a named author", () => {
    expect(
      articleJsonLd({
        title: "Titre",
        description: "Description",
        path: "/histoires/x",
        publishedOn: "2026-10-24",
      }),
    ).toMatchObject({
      "@type": "Article",
      headline: "Titre",
      datePublished: "2026-10-24",
      image: "https://passalio.com/og/histoires-x.png",
      author: { name: "Passalio" },
      publisher: { name: "Passalio" },
    });
  });

  it("cannot close the script tag that holds structured data", () => {
    expect(serializeJsonLd({ name: "</script><script>" })).not.toContain("</script>");
  });
});
