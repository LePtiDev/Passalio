import { screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import {
  accountFile,
  accountMembers,
  accountUsage,
  DROPPING_TREND,
  journalEntry,
} from "@/test-support/backoffice-records";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { withInstantRetries } from "@/test-support/instant-retries";
import { renderScreen } from "@/test-support/render-screen";
import { backofficeFr } from "../../fr";
import { AccountScreen } from "./account-screen";
import type { AccountTab } from "./account-tabs";

const text = backofficeFr.account;

const FILE_ROUTE = "GET /api/admin/accounts/account-1";
const MEMBERS_ROUTE = "GET /api/admin/accounts/account-1/members";
const USAGE_ROUTE = "GET /api/admin/accounts/account-1/usage";
const JOURNAL_ROUTE = "GET /api/admin/accounts/account-1/journal";

const TRACE_ID = "0b9a8c7d-6e5f-4a3b-9c2d-1e0f9a8b7c6d";

const AccountHarness = ({ initialTab }: { readonly initialTab: AccountTab }) => {
  const [tab, setTab] = useState<AccountTab>(initialTab);
  return <AccountScreen accountId="account-1" tab={tab} onTabChange={setTab} />;
};

const renderAccount = (initialTab: AccountTab = "personnel") =>
  renderScreen(withInstantRetries(<AccountHarness initialTab={initialTab} />), {
    path: "/admin/comptes/account-1",
  });

const tabs = () => screen.getByRole("tablist", { name: text.tabsLabel });

describe("AccountScreen", () => {
  it("shows a skeleton of the file while it loads", async () => {
    const reply = heldReply(jsonReply(accountFile("account-1", "Ramonage Martin")));
    installFakeApi({
      [FILE_ROUTE]: reply.reply,
      [MEMBERS_ROUTE]: jsonReply(accountMembers()),
    });

    renderAccount();

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    reply.release();

    expect(await screen.findByRole("tablist", { name: text.tabsLabel })).toBeVisible();
  });

  it("says the account no longer exists and links back to the list", async () => {
    installFakeApi({ [FILE_ROUTE]: errorReply("account_not_found", TRACE_ID, 404) });

    renderAccount();

    expect(await screen.findByText(text.notFound)).toBeVisible();
    expect(screen.getByRole("link", { name: text.backToList })).toHaveAttribute(
      "href",
      "/admin/comptes",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the error with the short trace id and loads the file again on retry", async () => {
    const api = installFakeApi({
      [FILE_ROUTE]: errorReply("internal", TRACE_ID),
      [MEMBERS_ROUTE]: jsonReply(accountMembers()),
    });

    const { user } = renderAccount();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(FILE_ROUTE, jsonReply(accountFile("account-1", "Ramonage Martin")));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByRole("tablist", { name: text.tabsLabel })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the company header and its staff with pending invitations on the first tab", async () => {
    installFakeApi({
      [FILE_ROUTE]: jsonReply(accountFile("account-1", "Ramonage Martin")),
      [MEMBERS_ROUTE]: jsonReply(
        accountMembers({
          invitations: [
            { email: "nouveau@ramonage-martin.test", role: "technician", createdAt: "2026-10-20" },
          ],
        }),
      ),
    });

    renderAccount();

    expect(await screen.findAllByRole("heading", { name: "Ramonage Martin" })).not.toHaveLength(0);
    expect(screen.getByText(/SIRET 12345678900012/)).toBeInTheDocument();
    expect(screen.getAllByText(text.trialPill("29 oct.")).length).toBeGreaterThan(0);
    expect(within(tabs()).getByRole("tab", { name: new RegExp(text.tabs.people) })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("paul@ramonage-martin.test")).toBeInTheDocument();
    expect(screen.getByText(backofficeFr.people.summary(1, 1))).toBeVisible();
    expect(screen.getByText("nouveau@ramonage-martin.test")).toBeVisible();
    expect(screen.getAllByText(backofficeFr.people.notActivated).length).toBeGreaterThan(0);
    expect(screen.getByText(backofficeFr.people.security.twoFactor)).toBeInTheDocument();
  });

  it("says that nobody works in the company when it has no member nor invitation", async () => {
    installFakeApi({
      [FILE_ROUTE]: jsonReply(accountFile("account-1", "Ramonage Martin")),
      [MEMBERS_ROUTE]: jsonReply(accountMembers({ members: [], invitations: [] })),
    });

    renderAccount();

    expect(await screen.findByText(backofficeFr.people.empty)).toBeVisible();
  });

  it("shows the staff error with the short trace id and retries it", async () => {
    const api = installFakeApi({
      [FILE_ROUTE]: jsonReply(accountFile("account-1", "Ramonage Martin")),
      [MEMBERS_ROUTE]: errorReply("internal", TRACE_ID),
    });

    const { user } = renderAccount();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));

    api.setRoute(MEMBERS_ROUTE, jsonReply(accountMembers()));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByText("paul@ramonage-martin.test")).toBeInTheDocument();
  });

  it("loads the usage when its tab is opened and explains a drop", async () => {
    const usage = heldReply(
      jsonReply(
        accountUsage({
          trend: DROPPING_TREND,
          people: [
            {
              userId: "member-2",
              name: "Léa Petit",
              role: "technician",
              months: [],
              trend: DROPPING_TREND,
            },
          ],
        }),
      ),
    );
    const api = installFakeApi({
      [FILE_ROUTE]: jsonReply(
        accountFile("account-1", "Ramonage Martin", { trend: DROPPING_TREND }),
      ),
      [MEMBERS_ROUTE]: jsonReply(accountMembers()),
      [USAGE_ROUTE]: usage.reply,
    });

    const { user } = renderAccount();

    await user.click(
      await within(await screen.findByRole("tablist", { name: text.tabsLabel })).findByRole("tab", {
        name: new RegExp(text.tabs.usage),
      }),
    );

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(api.requestsTo(USAGE_ROUTE)).toHaveLength(1);
    usage.release();

    expect(await screen.findByText(backofficeFr.usagePanel.droppingTitle(60))).toBeVisible();
    expect(screen.getByText(/La baisse vient surtout de Léa Petit/)).toBeVisible();
    expect(
      screen.getByRole("region", { name: backofficeFr.usagePanel.peopleTitle }),
    ).toHaveTextContent("Léa Petit");
    expect(busyRegions()).toHaveLength(0);
  });

  it("says that nobody used Passalio yet on the usage tab", async () => {
    installFakeApi({
      [FILE_ROUTE]: jsonReply(accountFile("account-1", "Ramonage Martin")),
      [USAGE_ROUTE]: jsonReply(accountUsage({ people: [] })),
    });

    renderAccount("utilisation");

    expect(await screen.findByText(backofficeFr.usagePanel.empty)).toBeVisible();
  });

  it("shows the company journal on the journal tab without repeating the company name", async () => {
    const api = installFakeApi({
      [FILE_ROUTE]: jsonReply(accountFile("account-1", "Ramonage Martin")),
      [JOURNAL_ROUTE]: jsonReply({
        entries: [journalEntry("entry-1", { action: "organization.logo_updated" })],
        nextCursor: null,
      }),
    });

    renderAccount("journal");

    expect(await screen.findByText(/a changé le logo de/)).toBeVisible();
    expect(screen.queryByRole("link", { name: "Ramonage Martin" })).toBeNull();
    expect(api.requestsTo(JOURNAL_ROUTE)).toHaveLength(1);
  });
});
