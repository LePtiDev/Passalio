import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { errorReply, heldReply, installFakeApi } from "@/test-support/fake-api";
import {
  forgetToasts,
  noContentReply,
  organizationProfile,
  ORGANIZATION_ROUTE,
  organizationReply,
  SHORT_TRACE_ID,
  signedInRoutes,
  TRACE_ID,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import type { OrganizationProfile } from "../../identity-api";
import { onboardingFr, TRADE_LABELS } from "../../onboarding-fr";
import { TradesStep } from "./trades-step";

const text = onboardingFr.trades;

const UPDATE_ROUTE = "PATCH /api/organization";

const renderTrades = (organization: OrganizationProfile) =>
  renderScreen(<TradesStep organization={organization} />, { path: "/configuration/metiers" });

const tradeCheckbox = (label: string) => screen.getByRole("checkbox", { name: new RegExp(label) });

describe("TradesStep", () => {
  afterEach(forgetToasts);

  it("asks for at least one trade", async () => {
    const api = installFakeApi({ ...signedInRoutes("owner"), [UPDATE_ROUTE]: noContentReply() });
    const { user } = renderTrades(organizationProfile({ trades: [] }));

    expect(await screen.findByText(text.selected(0))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: onboardingFr.layout.continue }));

    expect(await screen.findByRole("alert")).toHaveTextContent(text.required);
    expect(api.requestsTo(UPDATE_ROUTE)).toHaveLength(0);

    await user.click(tradeCheckbox(TRADE_LABELS.chimney_sweeping.label));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows every trade with its document and checks the trades already chosen", async () => {
    installFakeApi(signedInRoutes("owner"));
    renderTrades(organizationProfile({ trades: ["boiler_maintenance"] }));

    expect(await screen.findAllByRole("checkbox")).toHaveLength(5);
    expect(tradeCheckbox(TRADE_LABELS.boiler_maintenance.label)).toBeChecked();
    expect(tradeCheckbox(TRADE_LABELS.chimney_sweeping.label)).not.toBeChecked();
    expect(screen.getByText(TRADE_LABELS.septic_tank_emptying.document)).toBeVisible();
  });

  it("saves the chosen trades in the catalog order and opens the documents step", async () => {
    const update = heldReply(noContentReply());
    const api = installFakeApi({
      ...signedInRoutes("owner"),
      [UPDATE_ROUTE]: update.reply,
      [ORGANIZATION_ROUTE]: organizationReply(),
    });
    const { user, router } = renderTrades(organizationProfile({ trades: [] }));

    await user.click(
      await screen.findByRole("checkbox", {
        name: new RegExp(TRADE_LABELS.boiler_maintenance.label),
      }),
    );
    await user.click(tradeCheckbox(TRADE_LABELS.chimney_sweeping.label));
    expect(screen.getByText(text.selected(2))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: onboardingFr.layout.continue }));

    expect(await screen.findByRole("button", { name: onboardingFr.layout.saving })).toBeDisabled();
    update.release();

    await waitFor(() => expect(router.state.location.pathname).toBe("/configuration/documents"));
    expect(api.requestsTo(UPDATE_ROUTE)[0]?.body).toEqual({
      trades: ["chimney_sweeping", "boiler_maintenance"],
    });
  });

  it("shows a failed save with the short trace id and stays on the step", async () => {
    installFakeApi({
      ...signedInRoutes("owner"),
      [UPDATE_ROUTE]: errorReply("internal", TRACE_ID),
    });
    const { user, router } = renderTrades(organizationProfile({ trades: ["chimney_sweeping"] }));

    await user.click(await screen.findByRole("button", { name: onboardingFr.layout.continue }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(SHORT_TRACE_ID))).toBeVisible();
    expect(router.state.location.pathname).toBe("/configuration/metiers");
  });

  it("goes back to the company step", async () => {
    installFakeApi(signedInRoutes("owner"));
    const { user, router } = renderTrades(organizationProfile());

    await user.click(await screen.findByRole("link", { name: onboardingFr.layout.back }));

    expect(router.state.location.pathname).toBe("/configuration/entreprise");
  });
});
