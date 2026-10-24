import { screen, waitFor, within } from "@testing-library/react";
import { useCallback, useState } from "react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import {
  errorReply,
  heldReply,
  installFakeApi,
  jsonReply,
  type FakeRequest,
  type FakeRoutes,
} from "@/test-support/fake-api";
import { showMobileViewport } from "@/test-support/happy-dom-window";
import { renderScreen } from "@/test-support/render-screen";
import {
  companiesPage,
  companyCounts,
  companySummary,
  prospectFilters,
} from "@/test-support/sales-records";
import { salesFr } from "../../fr";
import type { CompanyListScope } from "../../sales-api";
import { CompaniesScreen } from "./companies-screen";

const text = salesFr.companies;

const COMPANIES_ROUTE = "GET /api/admin/prospects/companies";
const FILTERS_ROUTE = "GET /api/admin/prospects/filters";

const TRACE_ID = "1f2e3d4c-5b6a-4798-8a7b-6c5d4e3f2a1b";

const EVERYTHING: CompanyListScope = { stage: null, department: null, owner: null, search: "" };

const CompaniesHarness = ({ initialScope }: { readonly initialScope: CompanyListScope }) => {
  const [scope, setScope] = useState<CompanyListScope>(initialScope);
  const change = useCallback(
    (changes: Partial<CompanyListScope>) => setScope((previous) => ({ ...previous, ...changes })),
    [],
  );
  return <CompaniesScreen scope={scope} onScopeChange={change} />;
};

const renderCompanies = (routes: FakeRoutes, initialScope: CompanyListScope = EVERYTHING) => {
  const api = installFakeApi({ [FILTERS_ROUTE]: jsonReply(prospectFilters()), ...routes });
  return {
    ...renderScreen(<CompaniesHarness initialScope={initialScope} />, {
      path: "/admin/entreprises",
    }),
    api,
  };
};

const lastCompaniesRequest = (api: ReturnType<typeof renderCompanies>["api"]) =>
  api.requestsTo(COMPANIES_ROUTE).at(-1);

const stageTab = (name: string) => {
  const [desktopTabs] = screen.getAllByRole("tablist", { name: salesFr.list.tabsLabel });
  if (desktopTabs === undefined) {
    throw new Error("the stage tabs are missing");
  }
  return within(desktopTabs).getByRole("tab", { name: new RegExp(`^${name}`) });
};

const ONE_COMPANY = companiesPage({
  companies: [companySummary("company-1", "Ramonage Créteil")],
  counts: companyCounts({ all: 1, to_qualify: 1 }),
});

const limitOf = (request: FakeRequest) => Number(request.search.get("limit"));

describe("CompaniesScreen", () => {
  it("shows a skeleton of the list while the companies load", async () => {
    const reply = heldReply(jsonReply(companiesPage()));
    renderCompanies({ [COMPANIES_ROUTE]: reply.reply });

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.queryByText(text.emptyTitle)).not.toBeInTheDocument();

    reply.release();

    expect(await screen.findByText(text.emptyTitle)).toBeVisible();
    expect(busyRegions()).toHaveLength(0);
  });

  it("offers to add the first company when there is none", async () => {
    const { user } = renderCompanies({ [COMPANIES_ROUTE]: jsonReply(companiesPage()) });

    const title = await screen.findByText(text.emptyTitle);
    expect(screen.getByText(text.emptyText)).toBeVisible();
    const frame = title.closest("div");
    if (frame === null) {
      throw new Error("the empty state has no frame");
    }
    await user.click(within(frame).getByRole("button", { name: text.create }));

    expect(
      await screen.findByRole("dialog", { name: salesFr.companyForm.createTitle }),
    ).toBeVisible();
  });

  it("shows the companies at the chosen stage and offers to show all when there is none", async () => {
    const { user, api } = renderCompanies({
      [COMPANIES_ROUTE]: (request) =>
        request.search.get("stage") === "customer"
          ? jsonReply(companiesPage({ counts: companyCounts({ all: 1, to_qualify: 1 }) }))
          : jsonReply(ONE_COMPANY),
    });

    expect(await screen.findByRole("link", { name: text.open("Ramonage Créteil") })).toBeVisible();
    await user.click(stageTab(salesFr.stageTabs.customer));

    expect(await screen.findByText(text.stageEmpty(salesFr.stages.customer))).toBeVisible();
    expect(lastCompaniesRequest(api)?.search.get("stage")).toBe("customer");
    expect(stageTab(salesFr.stageTabs.customer)).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("button", { name: salesFr.list.showAll }));

    expect(await screen.findByRole("link", { name: text.open("Ramonage Créteil") })).toBeVisible();
    expect(lastCompaniesRequest(api)?.search.has("stage")).toBe(false);
    expect(stageTab(salesFr.stageTabs.all)).toHaveAttribute("aria-selected", "true");
  });

  it("searches the companies and offers to clear a search without result", async () => {
    const { user, api } = renderCompanies({
      [COMPANIES_ROUTE]: (request) =>
        request.search.get("q") === "Inconnue"
          ? jsonReply(companiesPage({ counts: companyCounts({ all: 1, to_qualify: 1 }) }))
          : jsonReply(ONE_COMPANY),
    });

    expect(await screen.findByRole("link", { name: text.open("Ramonage Créteil") })).toBeVisible();
    await user.type(screen.getByRole("searchbox", { name: text.searchLabel }), "Inconnue");

    expect(await screen.findByText(text.searchEmptyTitle("Inconnue"))).toBeVisible();
    expect(lastCompaniesRequest(api)?.search.get("q")).toBe("Inconnue");

    await user.click(screen.getByRole("button", { name: salesFr.list.clearSearch }));

    expect(await screen.findByRole("link", { name: text.open("Ramonage Créteil") })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: text.searchLabel })).toHaveValue("");
  });

  it("filters by department from the filters drawer on mobile and clears the filters", async () => {
    showMobileViewport();
    const { user, api } = renderCompanies({ [COMPANIES_ROUTE]: jsonReply(ONE_COMPANY) });

    expect(await screen.findByRole("link", { name: text.open("Ramonage Créteil") })).toBeVisible();
    await user.click(screen.getByRole("button", { name: salesFr.list.filtersActive(0) }));
    const drawer = await screen.findByRole("dialog", { name: salesFr.list.filters });
    const clearAll = within(drawer).getByRole("button", { name: salesFr.list.clearAllFilters });
    expect(clearAll).toBeDisabled();
    await user.click(within(drawer).getByRole("button", { name: /^Département/ }));
    await user.click(await within(drawer).findByRole("option", { name: "Val-de-Marne (94)" }));

    await waitFor(() => expect(lastCompaniesRequest(api)?.search.get("department")).toBe("94"));
    expect(
      await within(drawer).findByRole("button", { name: /^Département.*Val-de-Marne \(94\)/ }),
    ).toBeVisible();

    await user.click(within(drawer).getByRole("button", { name: salesFr.list.clearAllFilters }));

    await waitFor(() => expect(lastCompaniesRequest(api)?.search.has("department")).toBe(false));
    expect(
      within(drawer).getByRole("button", { name: /^Département.*Tous les départements/ }),
    ).toBeVisible();
  });

  it("removes the department filter from its chip", async () => {
    const { user, api } = renderCompanies(
      { [COMPANIES_ROUTE]: jsonReply(ONE_COMPANY) },
      { ...EVERYTHING, department: "94" },
    );

    expect(await screen.findByRole("link", { name: text.open("Ramonage Créteil") })).toBeVisible();
    expect(lastCompaniesRequest(api)?.search.get("department")).toBe("94");
    expect(screen.getByRole("button", { name: salesFr.list.filtersActive(1) })).toBeVisible();
    expect(screen.getByText("Val-de-Marne (94)")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: salesFr.list.removeFilter(salesFr.list.department) }),
    );

    await waitFor(() => expect(lastCompaniesRequest(api)?.search.has("department")).toBe(false));
    expect(screen.getByRole("button", { name: salesFr.list.filtersActive(0) })).toBeVisible();
  });

  it("shows the error with the short trace id and loads the companies again on retry", async () => {
    const { user, api } = renderCompanies({
      [COMPANIES_ROUTE]: errorReply("internal", TRACE_ID),
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(COMPANIES_ROUTE, jsonReply(ONE_COMPANY));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByRole("link", { name: text.open("Ramonage Créteil") })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists the companies with their stage, contact and owner and the stage counts", async () => {
    renderCompanies({
      [COMPANIES_ROUTE]: jsonReply(
        companiesPage({
          companies: [
            companySummary("company-1", "Ramonage Créteil", {
              stage: "interested",
              owner: { id: "owner-1", name: "Léa Commerciale" },
              mainContact: { id: "contact-1", name: "Jean Dupont" },
            }),
            companySummary("company-2", "Fumisterie Paris", {
              city: null,
              department: "75",
              phone: null,
            }),
          ],
          counts: companyCounts({ all: 2, to_qualify: 1, interested: 1 }),
        }),
      ),
    });

    const creteil = await screen.findByRole("link", { name: text.open("Ramonage Créteil") });
    expect(creteil).toHaveAttribute("href", "/admin/entreprises/company-1");
    expect(creteil).toHaveTextContent(salesFr.stages.interested);
    expect(creteil).toHaveTextContent("Jean Dupont");
    expect(creteil).toHaveTextContent("Léa Commerciale");
    const paris = screen.getByRole("link", { name: text.open("Fumisterie Paris") });
    expect(paris).toHaveTextContent(salesFr.list.noPhone);
    expect(paris).toHaveTextContent(salesFr.list.noContact);
    expect(stageTab(salesFr.stageTabs.interested)).toHaveTextContent("1");
    expect(stageTab(salesFr.stageTabs.all)).toHaveTextContent("2");
    expect(await screen.findByText(text.subtitle(16, 9))).toBeInTheDocument();
  });

  it("moves to the next page with the server cursor and back", async () => {
    const { user, api } = renderCompanies({
      [COMPANIES_ROUTE]: (request) => {
        const limit = limitOf(request);
        const counts = companyCounts({ all: limit + 1, to_qualify: limit + 1 });
        return request.search.get("cursor") === "cursor-2"
          ? jsonReply(
              companiesPage({ companies: [companySummary("company-last", "Dernière")], counts }),
            )
          : jsonReply(
              companiesPage({
                companies: Array.from({ length: limit }, (_, index) =>
                  companySummary(`company-${index}`, `Entreprise ${index}`),
                ),
                counts,
                nextCursor: "cursor-2",
              }),
            );
      },
    });

    expect(await screen.findByRole("link", { name: text.open("Entreprise 0") })).toBeVisible();
    const [firstRequest] = api.requestsTo(COMPANIES_ROUTE);
    const limit = firstRequest === undefined ? 0 : limitOf(firstRequest);
    const pagination = screen.getByRole("navigation", { name: fr.pagination.label });
    expect(pagination).toHaveTextContent(fr.pagination.range(1, limit, limit + 1));

    await user.click(within(pagination).getByRole("button", { name: fr.pagination.next }));

    expect(await screen.findByRole("link", { name: text.open("Dernière") })).toBeVisible();
    expect(lastCompaniesRequest(api)?.search.get("cursor")).toBe("cursor-2");
    expect(pagination).toHaveTextContent(fr.pagination.range(limit + 1, limit + 1, limit + 1));

    await user.click(within(pagination).getByRole("button", { name: fr.pagination.previous }));

    expect(await screen.findByRole("link", { name: text.open("Entreprise 0") })).toBeVisible();
  });
});
