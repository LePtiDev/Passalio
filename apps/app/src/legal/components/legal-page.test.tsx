import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { installFakeApi } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import type { LegalDocument } from "../legal-document";
import { LEGAL_PATHS } from "../legal-document";
import { legalFr } from "../legal-fr";
import { LEGAL_NOTICE_FR } from "../legal-notice-fr";
import { PRIVACY_FR } from "../privacy-fr";
import { TERMS_FR } from "../terms-fr";
import { LegalPage } from "./legal-page";

const DOCUMENTS: readonly (readonly [string, LegalDocument, string])[] = [
  ["terms", TERMS_FR, LEGAL_PATHS.terms],
  ["privacy policy", PRIVACY_FR, LEGAL_PATHS.privacy],
  ["legal notice", LEGAL_NOTICE_FR, LEGAL_PATHS.legalNotice],
];

const renderLegalPage = (content: LegalDocument, path: string) => {
  installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });
  return renderScreen(<LegalPage content={content} />, { path });
};

const desktopTableOfContents = () => {
  const [desktop] = screen.getAllByRole("navigation", { name: legalFr.tableOfContents });
  if (desktop === undefined) {
    throw new Error("no table of contents");
  }
  return desktop;
};

describe("LegalPage", () => {
  it.each(DOCUMENTS)(
    "shows the %s with its version and every section",
    async (_name, content, path) => {
      renderLegalPage(content, path);

      expect(await screen.findByRole("heading", { level: 1, name: content.title })).toBeVisible();
      expect(screen.getByText(legalFr.version)).toBeVisible();
      for (const section of content.sections) {
        expect(screen.getByRole("region", { name: section.title })).toBeInTheDocument();
      }
    },
  );

  it.each(DOCUMENTS)(
    "lists the sections of the %s in the table of contents and marks the first as current",
    async (_name, content, path) => {
      renderLegalPage(content, path);

      await screen.findByRole("heading", { level: 1, name: content.title });
      const links = within(desktopTableOfContents()).getAllByRole("link");
      expect(links.map((link) => link.getAttribute("href"))).toEqual(
        content.sections.map(({ id }) => `#${id}`),
      );
      expect(links[0]).toHaveAttribute("aria-current", "location");
    },
  );

  it("opens the table of contents on mobile", async () => {
    const { user } = renderLegalPage(PRIVACY_FR, LEGAL_PATHS.privacy);

    const toggle = await screen.findByRole("button", { name: legalFr.tableOfContents });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("navigation", { name: legalFr.tableOfContents })).toHaveLength(2);
  });

  it("links the three legal documents and marks the current one", async () => {
    const { user, router } = renderLegalPage(PRIVACY_FR, LEGAL_PATHS.privacy);

    await screen.findByRole("heading", { level: 1, name: PRIVACY_FR.title });
    const [tabs] = screen.getAllByRole("navigation", { name: legalFr.documentsNavigation });
    if (tabs === undefined) {
      throw new Error("no documents navigation");
    }
    const privacy = within(tabs).getByRole("link", { name: legalFr.links.privacy });
    expect(privacy).toHaveAttribute("data-status", "active");
    expect(within(tabs).getByRole("link", { name: legalFr.links.terms })).toHaveAttribute(
      "href",
      LEGAL_PATHS.terms,
    );

    await user.click(within(tabs).getByRole("link", { name: legalFr.links.legalNotice }));

    expect(router.state.location.pathname).toBe(LEGAL_PATHS.legalNotice);
  });

  it("offers a way back to the application", async () => {
    const { user, router } = renderLegalPage(TERMS_FR, LEGAL_PATHS.terms);

    await user.click(await screen.findByRole("link", { name: new RegExp(legalFr.backToApp) }));

    expect(router.state.location.pathname).toBe("/");
  });
});
