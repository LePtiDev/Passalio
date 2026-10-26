import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { installFakeApi, jsonReply } from "@/test-support/fake-api";
import { SIGN_OUT_ROUTE, signedInRoutes } from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { AppSidebar } from "./app-sidebar";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const USER = { name: "Paul Dupont", email: "paul.dupont.ramonage-et-entretien@ramonage-dupont.fr" };

const openAccountMenu = async () => {
  const rendered = renderScreen(<AppSidebar user={USER} />, { path: "/clients" });
  await rendered.user.click(
    await screen.findByRole("button", { name: `${fr.shell.account} ${USER.name}` }),
  );
  return { ...rendered, menu: await screen.findByRole("menu") };
};

describe("AppSidebar account menu", () => {
  it("shows only the name at the bottom of the sidebar", async () => {
    installFakeApi(signedInRoutes("owner"));

    renderScreen(<AppSidebar user={USER} />, { path: "/clients" });

    const trigger = await screen.findByRole("button", { name: `${fr.shell.account} ${USER.name}` });
    expect(trigger).toHaveTextContent(USER.name);
    expect(screen.queryByText(USER.email)).toBeNull();
    expect(screen.queryByRole("button", { name: fr.app.signOut })).toBeNull();
  });

  it("opens with the full address, the settings and the sign-out in red", async () => {
    installFakeApi(signedInRoutes("owner"));

    const { menu } = await openAccountMenu();

    expect(within(menu).getByText(USER.email)).toBeVisible();
    expect(within(menu).getByRole("menuitem", { name: fr.shell.settings })).toHaveAttribute(
      "href",
      "/reglages",
    );
    expect(within(menu).getByRole("menuitem", { name: fr.app.signOut })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
  });

  it("signs out from the menu and returns to sign-in", async () => {
    const api = installFakeApi({
      ...signedInRoutes("owner"),
      [SIGN_OUT_ROUTE]: jsonReply({ success: true }),
    });

    const { user, router, menu } = await openAccountMenu();
    await user.click(within(menu).getByRole("menuitem", { name: fr.app.signOut }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/connexion"));
    expect(api.requestsTo(SIGN_OUT_ROUTE)).toHaveLength(1);
  });
});
