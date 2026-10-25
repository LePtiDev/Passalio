import type { PlatformRole } from "@passalio/shared";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { installFakeApi } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import type { PlatformAdmin } from "../../backoffice-api";
import { backofficeFr } from "../../fr";
import { teamFr } from "../../team-fr";
import { AdminLayout } from "./admin-layout";

const text = backofficeFr.shell;

const adminWith = (role: PlatformRole): PlatformAdmin => ({
  userId: "admin-1",
  email: "quentin@passalio.test",
  name: "Quentin Admin",
  role,
});

const renderLayout = (role: PlatformRole) => {
  installFakeApi();
  return renderScreen(<AdminLayout admin={adminWith(role)} />, { path: "/admin/entreprises" });
};

const navigations = async () => screen.findAllByRole("navigation", { name: text.navigation });

const linkNamesIn = (navigation: HTMLElement) =>
  within(navigation)
    .getAllByRole("link")
    .map((link) => link.textContent);

const COMMERCIAL_LINKS = [
  { name: text.myDay, href: "/admin/journee" },
  { name: text.calls, href: "/admin/appels" },
  { name: text.companies, href: "/admin/entreprises" },
  { name: text.contacts, href: "/admin/contacts" },
  { name: text.prospection, href: "/admin/prospection" },
];

const PLATFORM_LABELS = [
  text.overview,
  text.overviewShort,
  text.accounts,
  text.accountsShort,
  text.journal,
  teamFr.navigation,
  teamFr.navigationShort,
];

describe("AdminLayout", () => {
  it("shows only the commercial section to the sales role", async () => {
    renderLayout("sales");

    const all = await navigations();
    expect(all).toHaveLength(2);
    for (const navigation of all) {
      expect(linkNamesIn(navigation)).toEqual(COMMERCIAL_LINKS.map(({ name }) => name));
      for (const { name, href } of COMMERCIAL_LINKS) {
        expect(within(navigation).getByRole("link", { name })).toHaveAttribute("href", href);
      }
      for (const label of PLATFORM_LABELS) {
        expect(within(navigation).queryByRole("link", { name: label })).toBeNull();
      }
      expect(within(navigation).queryByText(text.platform)).toBeNull();
    }
  });

  it("shows the commercial and platform sections to an admin, without the team", async () => {
    renderLayout("admin");

    const [sidebar, tabBar] = await navigations();
    if (sidebar === undefined || tabBar === undefined) {
      throw new Error("the layout has a sidebar and a tab bar");
    }
    expect(within(sidebar).getByText(text.commercial)).toBeInTheDocument();
    expect(within(sidebar).getByText(text.platform)).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: text.overview })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(within(sidebar).getByRole("link", { name: text.accounts })).toHaveAttribute(
      "href",
      "/admin/comptes",
    );
    expect(within(sidebar).getByRole("link", { name: text.journal })).toHaveAttribute(
      "href",
      "/admin/journal",
    );
    expect(within(sidebar).queryByRole("link", { name: teamFr.navigation })).toBeNull();
    expect(linkNamesIn(tabBar)).toEqual([
      text.commercial,
      text.overviewShort,
      text.accountsShort,
      text.journal,
    ]);
  });

  it("adds the Passalio team to the navigation of a super admin", async () => {
    renderLayout("superadmin");

    const [sidebar, tabBar] = await navigations();
    if (sidebar === undefined || tabBar === undefined) {
      throw new Error("the layout has a sidebar and a tab bar");
    }
    expect(within(sidebar).getByRole("link", { name: teamFr.navigation })).toHaveAttribute(
      "href",
      "/admin/equipe",
    );
    expect(within(tabBar).getByRole("link", { name: teamFr.navigationShort })).toHaveAttribute(
      "href",
      "/admin/equipe",
    );
  });

  it("marks the commercial tab as current on a commercial page for an admin", async () => {
    renderLayout("admin");

    const [, tabBar] = await navigations();
    if (tabBar === undefined) {
      throw new Error("the layout has a tab bar");
    }
    expect(within(tabBar).getByRole("link", { name: text.commercial })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: `${fr.shell.account} Quentin Admin` }),
    ).toBeInTheDocument();
  });

  it("opens the account menu to the profile, the configuration and the sign-out", async () => {
    const { user } = renderLayout("sales");

    await user.click(
      await screen.findByRole("button", { name: `${fr.shell.account} Quentin Admin` }),
    );

    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("quentin@passalio.test")).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: text.profile })).toHaveAttribute(
      "href",
      "/admin/configuration?rubrique=profil",
    );
    expect(within(menu).getByRole("menuitem", { name: text.configuration })).toHaveAttribute(
      "href",
      "/admin/configuration",
    );
    expect(within(menu).getByRole("menuitem", { name: fr.app.signOut })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
  });
});
