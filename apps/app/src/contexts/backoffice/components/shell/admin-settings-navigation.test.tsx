import type { PlatformRole } from "@passalio/shared";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { overview } from "@/test-support/backoffice-records";
import { installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { backofficeFr } from "../../fr";
import { settingsFr } from "../../settings-fr";
import { OverviewScreen } from "../overview/overview-screen";
import { AdminLayout } from "./admin-layout";

const adminWith = (role: PlatformRole) => ({
  userId: "admin-1",
  email: "quentin@passalio.test",
  name: "Quentin",
  role,
});

const renderLayout = (role: PlatformRole) => {
  installFakeApi();
  return renderScreen(<AdminLayout admin={adminWith(role)} />, { path: "/admin" });
};

const settingsLinks = async () => {
  const navigations = await screen.findAllByRole("navigation", {
    name: backofficeFr.shell.navigation,
  });
  return navigations.flatMap((navigation) =>
    within(navigation).queryAllByRole("link", { name: settingsFr.navigation }),
  );
};

describe("settings entry of the admin space", () => {
  it("shows the settings in the sidebar of a superadmin", async () => {
    renderLayout("superadmin");

    const links = await settingsLinks();
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/admin/reglages");
  });

  it.each<PlatformRole>(["admin", "sales"])("hides the settings from a %s", async (role) => {
    renderLayout(role);

    expect(await settingsLinks()).toEqual([]);
  });

  it("offers the settings from the mobile overview header of a superadmin", async () => {
    installFakeApi({ "GET /api/admin/overview": jsonReply(overview()) });

    renderScreen(<OverviewScreen canManageSettings />, { path: "/admin" });

    expect(await screen.findByRole("link", { name: settingsFr.open })).toHaveAttribute(
      "href",
      "/admin/reglages",
    );
  });

  it("does not offer the settings from the overview of an admin", async () => {
    installFakeApi({ "GET /api/admin/overview": jsonReply(overview()) });

    renderScreen(<OverviewScreen />, { path: "/admin" });

    expect(await screen.findAllByText(backofficeFr.overview.title)).not.toHaveLength(0);
    expect(screen.queryByRole("link", { name: settingsFr.open })).not.toBeInTheDocument();
  });
});
