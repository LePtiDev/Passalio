import { screen, waitFor } from "@testing-library/react";
import { Dexie } from "dexie";
import { describe, expect, it, vi } from "vitest";
import { fr } from "@/fr";
import { serverCustomerRecord } from "@/lib/sync/sync-test-records";
import { heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { SIGN_OUT_ROUTE, signedInRoutes } from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { SettingsScreen } from "./settings-screen";

await vi.hoisted(async () => {
  const { routeCapturedFetchToFakeApi } = await import("@/test-support/fetch-routing");
  routeCapturedFetchToFakeApi();
});

const USER = { name: "Paul Dupont", email: "paul@ramonage-dupont.fr" };

const renderSettings = () => renderScreen(<SettingsScreen user={USER} />, { path: "/reglages" });

describe("SettingsScreen", () => {
  it("opens the team page and shows the sections that are not built yet as disabled", async () => {
    installFakeApi(signedInRoutes("owner"));

    const { user, router } = renderSettings();

    const subscription = (await screen.findByText(fr.shell.subscription)).closest(
      "[aria-disabled]",
    );
    expect(subscription).toHaveAttribute("aria-disabled", "true");
    expect(subscription).toHaveTextContent(fr.shell.soon);
    expect(screen.queryByRole("link", { name: fr.shell.subscription })).toBeNull();

    await user.click(screen.getByRole("link", { name: fr.shell.team }));

    expect(router.state.location.pathname).toBe("/equipe");
  });

  it.each([
    { label: fr.shell.company, path: "/reglages/entreprise" },
    { label: fr.shell.documentSettings, path: "/reglages/documents" },
  ])("opens the $label settings", async ({ label, path }) => {
    installFakeApi(signedInRoutes("owner"));

    const { user, router } = renderSettings();

    await user.click(await screen.findByRole("link", { name: label }));

    expect(router.state.location.pathname).toBe(path);
  });

  it("shows the signed-in address", async () => {
    installFakeApi(signedInRoutes("owner"));

    renderSettings();

    expect(await screen.findByText(fr.settings.signedInAs)).toBeVisible();
    expect(screen.getByText(USER.email)).toBeVisible();
  });

  it("signs out, erases the local database and returns to sign-in", async () => {
    const api = installFakeApi({
      ...signedInRoutes("owner"),
      [SYNC_PULL_ROUTE]: pulledChangesReply({
        customers: [serverCustomerRecord("customer-1", "Moreau")],
      }),
      [SIGN_OUT_ROUTE]: jsonReply({ success: true }),
    });

    const { user, router, database } = renderSettings();
    await waitFor(async () => expect(await database.customers.count()).toBe(1));

    await user.click(await screen.findByRole("button", { name: fr.app.signOut }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/connexion"));
    expect(api.requestsTo(SIGN_OUT_ROUTE)).toHaveLength(1);
    expect(await Dexie.exists(database.name)).toBe(false);
  });

  it("shows a pending state and blocks a second click while signing out", async () => {
    const signOut = heldReply(jsonReply({ success: true }));
    const api = installFakeApi({ ...signedInRoutes("owner"), [SIGN_OUT_ROUTE]: signOut.reply });

    const { user, router } = renderSettings();

    const button = await screen.findByRole("button", { name: fr.app.signOut });
    await user.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    signOut.release();
    await waitFor(() => expect(router.state.location.pathname).toBe("/connexion"));
    expect(api.requestsTo(SIGN_OUT_ROUTE)).toHaveLength(1);
  });
});
