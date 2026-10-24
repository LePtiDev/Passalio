import { screen, waitFor, within } from "@testing-library/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { afterEach, describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { errorReply, installFakeApi, jsonReply, type FakeRoutes } from "@/test-support/fake-api";
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
const FIRST_FILE_ROUTE = "GET /api/admin/prospects/companies/lead-1";
const FIRST_STAGE_ROUTE = "POST /api/admin/prospects/companies/lead-1/stage";

const TRACE_ID = "b7c6d5e4-f3a2-4b19-8c07-d6e5f4a3b2c1";

const TO_QUALIFY: ProspectionScope = {
  tab: "to_qualify",
  department: null,
  search: "",
  companyId: null,
};

const QUALIFIED: ProspectionScope = { ...TO_QUALIFY, tab: "qualified" };

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
    companySummary("lead-1", "Ramonage Ivry"),
    companySummary("lead-2", "Fumisterie Orly", { city: "Orly" }),
  ],
  counts: companyCounts({ all: 2, to_qualify: 2 }),
});

const fileRoutes: FakeRoutes = {
  [FIRST_FILE_ROUTE]: jsonReply(
    companyFile(prospectCompany("lead-1", "Ramonage Ivry"), {
      contacts: [prospectContact("contact-ivry", "lead-1", "Moreau")],
    }),
  ),
  "GET /api/admin/prospects/companies/lead-2": jsonReply(
    companyFile(prospectCompany("lead-2", "Fumisterie Orly", { city: "Orly" })),
  ),
};

const leadButton = (name: string) => screen.getByRole("button", { name: text.select(name) });

const selectedCard = async () => {
  const card = (await screen.findByText("Jean Moreau")).closest("section");
  if (card === null) {
    throw new Error("the selected company is not shown in a card");
  }
  expect(card).toHaveAccessibleName(text.selectedLabel);
  return card;
};

describe("ProspectionScreen feedback", () => {
  afterEach(() => {
    toast.dismiss();
  });

  it("shows the error with the short trace id when only the map cannot be loaded", async () => {
    const { user, api } = renderProspection({
      [COMPANIES_ROUTE]: jsonReply(TWO_LEADS),
      [MAP_ROUTE]: errorReply("internal", TRACE_ID),
      ...fileRoutes,
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));

    api.setRoute(MAP_ROUTE, jsonReply(prospectMap()));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByRole("list", { name: text.leadsLabel })).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the error with the short trace id when the selected company cannot be loaded", async () => {
    const { user, api } = renderProspection({
      [COMPANIES_ROUTE]: jsonReply(TWO_LEADS),
      ...fileRoutes,
      [FIRST_FILE_ROUTE]: errorReply("internal", TRACE_ID),
    });

    expect(await screen.findByRole("list", { name: text.leadsLabel })).toBeVisible();
    const alerts = await screen.findAllByRole("alert");
    for (const alert of alerts) {
      expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    }
    const [firstAlert] = alerts;
    if (firstAlert === undefined) {
      throw new Error("no alert is shown");
    }

    api.setRoute(
      FIRST_FILE_ROUTE,
      jsonReply(
        companyFile(prospectCompany("lead-1", "Ramonage Ivry"), {
          contacts: [prospectContact("contact-ivry", "lead-1", "Moreau")],
        }),
      ),
    );
    await user.click(within(firstAlert).getByRole("button", { name: fr.errors.retry }));

    expect(await selectedCard()).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });

  it("marks the selected company as not interested and moves to the next one", async () => {
    const { user, api } = renderProspection({
      [COMPANIES_ROUTE]: jsonReply(TWO_LEADS),
      [FIRST_STAGE_ROUTE]: jsonReply(null, 204),
      ...fileRoutes,
    });

    const card = await selectedCard();
    await user.click(within(card).getByRole("button", { name: text.reject }));

    expect(
      await screen.findByText(salesFr.stageReached("Ramonage Ivry", "not_interested")),
    ).toBeVisible();
    expect(api.requestsTo(FIRST_STAGE_ROUTE)[0]?.body).toEqual({ stage: "not_interested" });
    await waitFor(() =>
      expect(leadButton("Fumisterie Orly")).toHaveAttribute("aria-pressed", "true"),
    );
  });

  it("keeps the company selected and shows the short trace id when qualifying fails", async () => {
    const { user } = renderProspection({
      [COMPANIES_ROUTE]: jsonReply(TWO_LEADS),
      [FIRST_STAGE_ROUTE]: errorReply("internal", TRACE_ID),
      ...fileRoutes,
    });

    const card = await selectedCard();
    await user.click(within(card).getByRole("button", { name: text.qualify }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
    expect(leadButton("Ramonage Ivry")).toHaveAttribute("aria-pressed", "true");
    expect(leadButton("Fumisterie Orly")).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(salesFr.stageReached("Ramonage Ivry", "qualified"))).toBeNull();
  });

  it("does not offer to qualify again a company that is already qualified", async () => {
    installFakeApi({
      [FILTERS_ROUTE]: jsonReply(prospectFilters()),
      [MAP_ROUTE]: jsonReply(prospectMap()),
      [COMPANIES_ROUTE]: jsonReply(
        companiesPage({
          companies: [companySummary("lead-1", "Ramonage Ivry", { stage: "qualified" })],
          counts: companyCounts({ all: 1, qualified: 1 }),
        }),
      ),
      [FIRST_FILE_ROUTE]: jsonReply(
        companyFile(prospectCompany("lead-1", "Ramonage Ivry", { stage: "qualified" }), {
          contacts: [prospectContact("contact-ivry", "lead-1", "Moreau")],
        }),
      ),
    });

    renderScreen(withInstantRetries(<ProspectionHarness initialScope={QUALIFIED} />), {
      path: "/admin/prospection",
    });

    const card = await selectedCard();
    const qualify = within(card).getByRole("button", { name: text.qualify });
    expect(qualify).toHaveAttribute("aria-pressed", "true");
    expect(qualify).toBeDisabled();
    expect(within(card).getByRole("button", { name: text.reject })).toBeEnabled();
  });
});
