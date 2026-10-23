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
import { withInstantRetries } from "@/test-support/instant-retries";
import { renderScreen } from "@/test-support/render-screen";
import {
  companiesPage,
  companyCounts,
  companyFile,
  companySummary,
  prospectCompany,
  prospectContact,
  prospectFilters,
  prospectMap,
} from "@/test-support/sales-records";
import { salesFr } from "../../fr";
import type { ProspectionScope } from "./prospection-scope";
import { ProspectionScreen } from "./prospection-screen";

const text = salesFr.prospection;

const COMPANIES_ROUTE = "GET /api/admin/prospects/companies";
const MAP_ROUTE = "GET /api/admin/prospects/map";
const FILTERS_ROUTE = "GET /api/admin/prospects/filters";

const TRACE_ID = "e1d2c3b4-a596-4877-9869-5a4b3c2d1e0f";

const TO_QUALIFY: ProspectionScope = {
  tab: "to_qualify",
  department: null,
  search: "",
  companyId: null,
};

const ProspectionHarness = ({ initialScope }: { readonly initialScope: ProspectionScope }) => {
  const [scope, setScope] = useState<ProspectionScope>(initialScope);
  const change = useCallback(
    (changes: Partial<ProspectionScope>) => setScope((previous) => ({ ...previous, ...changes })),
    [],
  );
  return <ProspectionScreen scope={scope} onScopeChange={change} />;
};

const renderProspection = (routes: FakeRoutes, initialScope: ProspectionScope = TO_QUALIFY) => {
  const api = installFakeApi({
    [FILTERS_ROUTE]: jsonReply(prospectFilters()),
    [MAP_ROUTE]: jsonReply(prospectMap()),
    ...routes,
  });
  return {
    ...renderScreen(withInstantRetries(<ProspectionHarness initialScope={initialScope} />), {
      path: "/admin/prospection",
    }),
    api,
  };
};

const TWO_LEADS = companiesPage({
  companies: [
    companySummary("company-1", "Ramonage Créteil"),
    companySummary("company-2", "Fumisterie Vitry", { city: "Vitry-sur-Seine", phone: null }),
  ],
  counts: companyCounts({ all: 2, to_qualify: 2 }),
});

const fileRoutes: FakeRoutes = {
  "GET /api/admin/prospects/companies/company-1": jsonReply(
    companyFile(prospectCompany("company-1", "Ramonage Créteil"), {
      contacts: [prospectContact("contact-1", "company-1", "Dupont")],
    }),
  ),
  "GET /api/admin/prospects/companies/company-2": jsonReply(
    companyFile(
      prospectCompany("company-2", "Fumisterie Vitry", {
        city: "Vitry-sur-Seine",
        phone: null,
        website: null,
        activity: null,
      }),
    ),
  ),
};

const leadButton = (name: string) => screen.getByRole("button", { name: text.select(name) });

const selectedCardShowing = async (fact: string) => {
  const card = (await screen.findByText(fact)).closest("section");
  if (card === null) {
    throw new Error(`${fact} is not shown in a card`);
  }
  expect(card).toHaveAccessibleName(text.selectedLabel);
  return card;
};

const limitOf = (request: FakeRequest) => Number(request.search.get("limit"));

describe("ProspectionScreen", () => {
  it("shows skeletons of the list and of the selected company while they load", async () => {
    const companies = heldReply(jsonReply(TWO_LEADS));
    renderProspection({ [COMPANIES_ROUTE]: companies.reply, ...fileRoutes });

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(busyRegions().length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("list", { name: text.leadsLabel })).toBeNull();

    companies.release();

    expect(await screen.findByRole("list", { name: text.leadsLabel })).toBeVisible();
    expect(await selectedCardShowing("Jean Dupont")).toBeVisible();
    expect(busyRegions()).toHaveLength(0);
  });

  it("sends to the companies when there is nothing to qualify", async () => {
    renderProspection({
      [COMPANIES_ROUTE]: jsonReply(companiesPage({ counts: companyCounts({ all: 3 }) })),
    });

    const [title] = await screen.findAllByText(text.emptyTitle("to_qualify"));
    expect(title).toBeVisible();
    const links = screen.getAllByRole("link", { name: text.seeCompanies });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/admin/entreprises");
    }
  });

  it("offers to look in every department when the chosen one has nothing to qualify", async () => {
    const { user, api } = renderProspection(
      {
        [COMPANIES_ROUTE]: (request) =>
          request.search.get("department") === "75"
            ? jsonReply(companiesPage({ counts: companyCounts({ all: 2 }) }))
            : jsonReply(TWO_LEADS),
        ...fileRoutes,
      },
      { ...TO_QUALIFY, department: "75" },
    );

    const [clearDepartment] = await screen.findAllByRole("button", {
      name: salesFr.list.anyDepartment,
    });
    if (clearDepartment === undefined) {
      throw new Error("no button clears the department");
    }
    await user.click(clearDepartment);

    expect(await screen.findByRole("list", { name: text.leadsLabel })).toBeVisible();
    expect(api.requestsTo(COMPANIES_ROUTE).at(-1)?.search.has("department")).toBe(false);
    expect(api.requestsTo(MAP_ROUTE).at(-1)?.search.has("department")).toBe(false);
  });

  it("shows the error with the short trace id and loads the leads again on retry", async () => {
    const { user, api } = renderProspection({
      [COMPANIES_ROUTE]: errorReply("internal", TRACE_ID),
      ...fileRoutes,
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(COMPANIES_ROUTE, jsonReply(TWO_LEADS));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByRole("list", { name: text.leadsLabel })).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("selects the first lead and shows its leader, phone, activity and website", async () => {
    renderProspection({ [COMPANIES_ROUTE]: jsonReply(TWO_LEADS), ...fileRoutes });

    expect(await screen.findByRole("list", { name: text.leadsLabel })).toBeVisible();
    expect(leadButton("Ramonage Créteil")).toHaveAttribute("aria-pressed", "true");
    expect(leadButton("Fumisterie Vitry")).toHaveAttribute("aria-pressed", "false");
    expect(leadButton("Fumisterie Vitry")).toHaveTextContent(salesFr.list.noPhone);

    const card = await selectedCardShowing("Jean Dupont");
    expect(card).toHaveTextContent("01 45 67 89 10");
    expect(card).toHaveTextContent("Ramonage");
    expect(card).toHaveTextContent("ramonage-creteil.test");
    expect(within(card).getByRole("link", { name: text.openFile })).toHaveAttribute(
      "href",
      "/admin/entreprises/company-1",
    );
  });

  it("shows the company picked in the list with what is still missing", async () => {
    const { user } = renderProspection({ [COMPANIES_ROUTE]: jsonReply(TWO_LEADS), ...fileRoutes });

    expect(await screen.findByRole("list", { name: text.leadsLabel })).toBeVisible();
    await user.click(leadButton("Fumisterie Vitry"));

    await waitFor(() =>
      expect(leadButton("Fumisterie Vitry")).toHaveAttribute("aria-pressed", "true"),
    );
    const card = await selectedCardShowing(text.missingActivity);
    expect(card).toHaveTextContent("Fumisterie Vitry");
    expect(card).toHaveTextContent(text.missingLeader);
    expect(card).toHaveTextContent(text.missingActivity);
    expect(card).toHaveTextContent(text.missingWebsite);
  });

  it("qualifies the selected company, confirms with a toast and moves to the next one", async () => {
    const { user, api } = renderProspection({
      [COMPANIES_ROUTE]: jsonReply(TWO_LEADS),
      "POST /api/admin/prospects/companies/company-1/stage": jsonReply(null, 204),
      ...fileRoutes,
    });

    const card = await selectedCardShowing("Jean Dupont");
    await user.click(within(card).getByRole("button", { name: text.qualify }));

    expect(
      await screen.findByText(salesFr.stageReached("Ramonage Créteil", "qualified")),
    ).toBeVisible();
    expect(api.requestsTo("POST /api/admin/prospects/companies/company-1/stage")[0]?.body).toEqual({
      stage: "qualified",
    });
    await waitFor(() =>
      expect(leadButton("Fumisterie Vitry")).toHaveAttribute("aria-pressed", "true"),
    );
  });

  it("asks the server for the leads of the chosen tab", async () => {
    const { user, api } = renderProspection({
      [COMPANIES_ROUTE]: (request) =>
        request.search.get("stage") === "qualified"
          ? jsonReply(
              companiesPage({
                companies: [
                  companySummary("company-2", "Fumisterie Vitry", { stage: "qualified" }),
                ],
                counts: companyCounts({ all: 3, to_qualify: 2, qualified: 1 }),
              }),
            )
          : jsonReply(TWO_LEADS),
      ...fileRoutes,
    });

    expect(await screen.findByRole("list", { name: text.leadsLabel })).toBeVisible();
    const [tabs] = screen.getAllByRole("tablist", { name: salesFr.list.tabsLabel });
    if (tabs === undefined) {
      throw new Error("the tabs are missing");
    }
    await user.click(within(tabs).getByRole("tab", { name: /^Qualifiées/ }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: text.select("Ramonage Créteil") })).toBeNull(),
    );
    expect(leadButton("Fumisterie Vitry")).toBeVisible();
    expect(api.requestsTo(COMPANIES_ROUTE).at(-1)?.search.get("stage")).toBe("qualified");
  });

  it("moves to the next page of leads with the server cursor", async () => {
    const { user, api } = renderProspection({
      [COMPANIES_ROUTE]: (request) => {
        const limit = limitOf(request);
        const counts = companyCounts({ all: limit + 1, to_qualify: limit + 1 });
        return request.search.get("cursor") === "cursor-2"
          ? jsonReply(
              companiesPage({
                companies: [companySummary("company-2", "Fumisterie Vitry")],
                counts,
              }),
            )
          : jsonReply(
              companiesPage({
                companies: Array.from({ length: limit }, (_, index) =>
                  companySummary(index === 0 ? "company-1" : `company-x${index}`, `Lead ${index}`),
                ),
                counts,
                nextCursor: "cursor-2",
              }),
            );
      },
      ...fileRoutes,
    });

    expect(await screen.findByRole("button", { name: text.select("Lead 0") })).toBeVisible();
    const pagination = screen.getByRole("navigation", { name: fr.pagination.label });
    await user.click(within(pagination).getByRole("button", { name: fr.pagination.next }));

    expect(
      await screen.findByRole("button", { name: text.select("Fumisterie Vitry") }),
    ).toBeVisible();
    expect(api.requestsTo(COMPANIES_ROUTE).at(-1)?.search.get("cursor")).toBe("cursor-2");
  });
});
