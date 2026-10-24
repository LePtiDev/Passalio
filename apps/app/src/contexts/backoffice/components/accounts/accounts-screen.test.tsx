import type { AccountsPageResponse } from "@passalio/shared";
import { screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { accountSummary, DROPPING_TREND } from "@/test-support/backoffice-records";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import {
  errorReply,
  heldReply,
  installFakeApi,
  jsonReply,
  type FakeRequest,
} from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import type { AccountFilter } from "../../backoffice-api";
import { backofficeFr } from "../../fr";
import { AccountsScreen } from "./accounts-screen";

const text = backofficeFr.accounts;

const ACCOUNTS_ROUTE = "GET /api/admin/accounts";

const TRACE_ID = "c3d2e1f0-9a8b-4c7d-8e6f-5a4b3c2d1e0f";

const page = (overrides: Partial<AccountsPageResponse> = {}): AccountsPageResponse => ({
  accounts: [],
  counts: { all: 0, trial: 0, dropping: 0 },
  nextCursor: null,
  ...overrides,
});

const AccountsHarness = ({ initialFilter }: { readonly initialFilter: AccountFilter }) => {
  const [filter, setFilter] = useState<AccountFilter>(initialFilter);
  const [search, setSearch] = useState("");
  return (
    <AccountsScreen
      filter={filter}
      search={search}
      onFilterChange={setFilter}
      onSearchChange={setSearch}
    />
  );
};

const renderAccounts = (initialFilter: AccountFilter = "all") =>
  renderScreen(<AccountsHarness initialFilter={initialFilter} />, { path: "/admin/comptes" });

const filterButtons = () => screen.getByRole("group", { name: text.filtersLabel });

const limitOf = (request: FakeRequest) => Number(request.search.get("limit"));

describe("AccountsScreen", () => {
  it("shows a skeleton of the rows while the accounts load", async () => {
    const reply = heldReply(jsonReply(page()));
    installFakeApi({ [ACCOUNTS_ROUTE]: reply.reply });

    renderAccounts();

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.queryByText(text.filterEmpty.all)).not.toBeInTheDocument();
    expect(screen.getByText(text.subtitleLoading)).toBeInTheDocument();

    reply.release();

    expect(await screen.findByText(text.filterEmpty.all)).toBeVisible();
    expect(busyRegions()).toHaveLength(0);
  });

  it("offers to copy the sign-up link when no company has signed up yet", async () => {
    installFakeApi({ [ACCOUNTS_ROUTE]: jsonReply(page()) });

    const { user } = renderAccounts();

    expect(await screen.findByText(text.filterEmpty.all)).toBeVisible();
    expect(screen.getByText(text.allEmptyText)).toBeVisible();
    await user.click(screen.getByRole("button", { name: text.copySignUpLink }));

    expect(await screen.findByText(text.signUpLinkCopied)).toBeVisible();
    expect(await navigator.clipboard.readText()).toBe(`${window.location.origin}/inscription`);
  });

  it("offers to show every company when the trial filter has no result", async () => {
    const api = installFakeApi({
      [ACCOUNTS_ROUTE]: (request) =>
        request.search.get("filter") === "trial"
          ? jsonReply(page({ counts: { all: 1, trial: 0, dropping: 0 } }))
          : jsonReply(
              page({
                accounts: [accountSummary("account-1", "Ramonage Martin")],
                counts: { all: 1, trial: 0, dropping: 0 },
              }),
            ),
    });

    const { user } = renderAccounts("trial");

    expect(await screen.findByText(text.filterEmpty.trial)).toBeVisible();
    expect(screen.getByText(text.filterEmptyText)).toBeVisible();
    await user.click(screen.getByRole("button", { name: text.showAll }));

    expect(await screen.findByRole("link", { name: text.open("Ramonage Martin") })).toBeVisible();
    expect(api.requestsTo(ACCOUNTS_ROUTE).at(-1)?.search.get("filter")).toBe("all");
    expect(within(filterButtons()).getByRole("button", { name: /Toutes/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("searches companies by name and offers to clear a search without result", async () => {
    const api = installFakeApi({
      [ACCOUNTS_ROUTE]: (request) =>
        request.search.get("q") === "Inconnue"
          ? jsonReply(page({ counts: { all: 1, trial: 1, dropping: 0 } }))
          : jsonReply(
              page({
                accounts: [accountSummary("account-1", "Ramonage Martin")],
                counts: { all: 1, trial: 1, dropping: 0 },
              }),
            ),
    });

    const { user } = renderAccounts();

    expect(await screen.findByRole("link", { name: text.open("Ramonage Martin") })).toBeVisible();
    await user.type(screen.getByRole("searchbox", { name: text.searchLabel }), "Inconnue");

    expect(await screen.findByText(text.searchEmptyTitle("Inconnue"))).toBeVisible();
    expect(api.requestsTo(ACCOUNTS_ROUTE).at(-1)?.search.get("q")).toBe("Inconnue");
    expect(screen.getByText(text.searchEmptyText)).toBeVisible();

    await user.click(screen.getByRole("button", { name: text.clearSearch }));

    expect(await screen.findByRole("link", { name: text.open("Ramonage Martin") })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: text.searchLabel })).toHaveValue("");
  });

  it("shows the error with the short trace id and loads the accounts again on retry", async () => {
    const api = installFakeApi({ [ACCOUNTS_ROUTE]: errorReply("internal", TRACE_ID) });

    const { user } = renderAccounts();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(
      ACCOUNTS_ROUTE,
      jsonReply(
        page({
          accounts: [accountSummary("account-1", "Ramonage Martin")],
          counts: { all: 1, trial: 1, dropping: 0 },
        }),
      ),
    );
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByRole("link", { name: text.open("Ramonage Martin") })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists the companies with their trial, staff and usage and the filter counts", async () => {
    installFakeApi({
      [ACCOUNTS_ROUTE]: jsonReply(
        page({
          accounts: [
            accountSummary("account-1", "Ramonage Martin"),
            accountSummary("account-2", "Fumisterie Leroy", {
              isInTrial: false,
              staffCount: 3,
              trend: DROPPING_TREND,
            }),
          ],
          counts: { all: 2, trial: 1, dropping: 1 },
        }),
      ),
    });

    renderAccounts();

    const martin = await screen.findByRole("link", { name: text.open("Ramonage Martin") });
    expect(martin).toHaveAttribute("href", "/admin/comptes/account-1");
    expect(martin).toHaveTextContent(backofficeFr.status.trial);
    const leroy = screen.getByRole("link", { name: text.open("Fumisterie Leroy") });
    expect(leroy).toHaveAttribute("href", "/admin/comptes/account-2");
    expect(leroy).toHaveTextContent(backofficeFr.status.trialEnded);
    expect(leroy).toHaveTextContent(backofficeFr.usage.staff(3));
    expect(leroy).toHaveTextContent("−60 %");
    expect(screen.getByText(text.subtitle(2))).toBeInTheDocument();
    expect(within(filterButtons()).getByRole("button", { name: /Toutes/ })).toHaveTextContent("2");
    expect(within(filterButtons()).getByRole("button", { name: /baisse/ })).toHaveTextContent("1");
  });

  it("asks the server for the chosen filter and marks it as selected", async () => {
    const api = installFakeApi({
      [ACCOUNTS_ROUTE]: (request) =>
        jsonReply(
          page({
            accounts: [
              request.search.get("filter") === "dropping"
                ? accountSummary("account-2", "Fumisterie Leroy", { trend: DROPPING_TREND })
                : accountSummary("account-1", "Ramonage Martin"),
            ],
            counts: { all: 2, trial: 2, dropping: 1 },
          }),
        ),
    });

    const { user } = renderAccounts();

    expect(await screen.findByRole("link", { name: text.open("Ramonage Martin") })).toBeVisible();
    const dropping = within(filterButtons()).getByRole("button", { name: /baisse/ });
    expect(dropping).toHaveAttribute("aria-pressed", "false");
    await user.click(dropping);

    expect(await screen.findByRole("link", { name: text.open("Fumisterie Leroy") })).toBeVisible();
    expect(dropping).toHaveAttribute("aria-pressed", "true");
    expect(api.requestsTo(ACCOUNTS_ROUTE).at(-1)?.search.get("filter")).toBe("dropping");
  });

  it("moves to the next page with the server cursor and back to the first page", async () => {
    const api = installFakeApi({
      [ACCOUNTS_ROUTE]: (request) => {
        const limit = limitOf(request);
        const total = limit + 2;
        const counts = { all: total, trial: total, dropping: 0 };
        if (request.search.get("cursor") === "cursor-2") {
          return jsonReply(
            page({
              accounts: [
                accountSummary("account-last-1", "Dernière Entreprise A"),
                accountSummary("account-last-2", "Dernière Entreprise B"),
              ],
              counts,
            }),
          );
        }
        return jsonReply(
          page({
            accounts: Array.from({ length: limit }, (_, index) =>
              accountSummary(`account-${index}`, `Entreprise ${index}`),
            ),
            counts,
            nextCursor: "cursor-2",
          }),
        );
      },
    });

    const { user } = renderAccounts();

    expect(await screen.findByRole("link", { name: text.open("Entreprise 0") })).toBeVisible();
    const [firstRequest] = api.requestsTo(ACCOUNTS_ROUTE);
    const limit = firstRequest === undefined ? 0 : limitOf(firstRequest);
    expect(limit).toBeGreaterThanOrEqual(5);
    const pagination = screen.getByRole("navigation", { name: fr.pagination.label });
    expect(pagination).toHaveTextContent(fr.pagination.range(1, limit, limit + 2));
    const previous = within(pagination).getByRole("button", { name: fr.pagination.previous });
    const next = within(pagination).getByRole("button", { name: fr.pagination.next });
    expect(previous).toBeDisabled();

    await user.click(next);

    expect(
      await screen.findByRole("link", { name: text.open("Dernière Entreprise A") }),
    ).toBeVisible();
    expect(api.requestsTo(ACCOUNTS_ROUTE).at(-1)?.search.get("cursor")).toBe("cursor-2");
    expect(pagination).toHaveTextContent(fr.pagination.range(limit + 1, limit + 2, limit + 2));
    expect(screen.queryByRole("link", { name: text.open("Entreprise 0") })).toBeNull();
    await waitFor(() => expect(next).toBeDisabled());
    expect(previous).toBeEnabled();

    await user.click(previous);

    expect(await screen.findByRole("link", { name: text.open("Entreprise 0") })).toBeVisible();
    expect(previous).toBeDisabled();
  });
});
