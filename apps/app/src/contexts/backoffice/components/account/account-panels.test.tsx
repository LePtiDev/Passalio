import { screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { accountFile, accountUsage, journalEntry } from "@/test-support/backoffice-records";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { withInstantRetries } from "@/test-support/instant-retries";
import { renderScreen } from "@/test-support/render-screen";
import { backofficeFr } from "../../fr";
import { AccountScreen } from "./account-screen";
import type { AccountTab } from "./account-tabs";

const FILE_ROUTE = "GET /api/admin/accounts/account-7";
const USAGE_ROUTE = "GET /api/admin/accounts/account-7/usage";
const JOURNAL_ROUTE = "GET /api/admin/accounts/account-7/journal";

const TRACE_ID = "d4c3b2a1-0f9e-4d8c-b7a6-958473625140";

const MARTIN_FILE = accountFile("account-7", "Ramonage Martin");

const AccountHarness = ({ initialTab }: { readonly initialTab: AccountTab }) => {
  const [tab, setTab] = useState<AccountTab>(initialTab);
  return <AccountScreen accountId="account-7" tab={tab} onTabChange={setTab} />;
};

const renderAccount = (initialTab: AccountTab) =>
  renderScreen(withInstantRetries(<AccountHarness initialTab={initialTab} />), {
    path: "/admin/comptes/account-7",
  });

describe("AccountScreen usage and journal panels", () => {
  it("shows the usage error with the short trace id and loads the usage again on retry", async () => {
    const api = installFakeApi({
      [FILE_ROUTE]: jsonReply(MARTIN_FILE),
      [USAGE_ROUTE]: errorReply("internal", TRACE_ID),
    });

    const { user } = renderAccount("utilisation");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(USAGE_ROUTE, jsonReply(accountUsage()));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(
      await screen.findByRole("region", { name: backofficeFr.usagePanel.peopleTitle }),
    ).toHaveTextContent("Paul Martin");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("does not warn about a drop when the usage is steady", async () => {
    installFakeApi({
      [FILE_ROUTE]: jsonReply(MARTIN_FILE),
      [USAGE_ROUTE]: jsonReply(accountUsage()),
    });

    renderAccount("utilisation");

    expect(
      await screen.findByRole("region", { name: backofficeFr.usagePanel.peopleTitle }),
    ).toHaveTextContent("Paul Martin");
    expect(screen.queryByText(/Utilisation en baisse/)).toBeNull();
  });

  it("shows a skeleton of the company journal while it loads", async () => {
    const journal = heldReply(jsonReply({ entries: [], nextCursor: null }));
    installFakeApi({ [FILE_ROUTE]: jsonReply(MARTIN_FILE), [JOURNAL_ROUTE]: journal.reply });

    renderAccount("journal");

    expect(
      await screen.findByRole("tablist", { name: backofficeFr.account.tabsLabel }),
    ).toBeVisible();
    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.queryByText(backofficeFr.journal.empty)).toBeNull();

    journal.release();

    expect(await screen.findByText(backofficeFr.journal.empty)).toBeVisible();
    expect(busyRegions()).toHaveLength(0);
  });

  it("shows the company journal error with the short trace id and retries it", async () => {
    const api = installFakeApi({
      [FILE_ROUTE]: jsonReply(MARTIN_FILE),
      [JOURNAL_ROUTE]: errorReply("internal", TRACE_ID),
    });

    const { user } = renderAccount("journal");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));

    api.setRoute(
      JOURNAL_ROUTE,
      jsonReply({
        entries: [journalEntry("entry-9", { action: "organization.logo_updated" })],
        nextCursor: null,
      }),
    );
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByText(/a changé le logo de/)).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("loads the company journal only when its tab is opened", async () => {
    const api = installFakeApi({
      [FILE_ROUTE]: jsonReply(MARTIN_FILE),
      [USAGE_ROUTE]: jsonReply(accountUsage()),
      [JOURNAL_ROUTE]: jsonReply({ entries: [], nextCursor: null }),
    });

    const { user } = renderAccount("utilisation");

    const tablist = await screen.findByRole("tablist", { name: backofficeFr.account.tabsLabel });
    expect(
      await screen.findByRole("region", { name: backofficeFr.usagePanel.peopleTitle }),
    ).toBeVisible();
    expect(api.requestsTo(JOURNAL_ROUTE)).toHaveLength(0);

    const journalTab = within(tablist).getByRole("tab", {
      name: new RegExp(backofficeFr.account.tabs.journal),
    });
    await user.click(journalTab);

    expect(await screen.findByText(backofficeFr.journal.empty)).toBeVisible();
    expect(journalTab).toHaveAttribute("aria-selected", "true");
    expect(api.requestsTo(JOURNAL_ROUTE)).toHaveLength(1);
  });
});
