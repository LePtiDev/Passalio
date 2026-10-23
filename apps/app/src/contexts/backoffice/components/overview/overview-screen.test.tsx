import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import {
  accountSummary,
  DROPPING_TREND,
  journalEntry,
  overview,
} from "@/test-support/backoffice-records";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { backofficeFr } from "../../fr";
import { OverviewScreen } from "./overview-screen";

const text = backofficeFr.overview;

const OVERVIEW_ROUTE = "GET /api/admin/overview";

const TRACE_ID = "7a1c9e2f-4b3d-4f5a-8c6e-1d2b3a4c5e6f";

const section = (name: string) => screen.getByRole("region", { name });

describe("OverviewScreen", () => {
  it("shows a skeleton of the tiles and cards while the overview loads", async () => {
    const reply = heldReply(jsonReply(overview()));
    installFakeApi({ [OVERVIEW_ROUTE]: reply.reply });

    renderScreen(<OverviewScreen />, { path: "/admin" });

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: text.droppingTitle })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    reply.release();

    expect(await screen.findByRole("region", { name: text.droppingTitle })).toBeVisible();
    expect(busyRegions()).toHaveLength(0);
  });

  it("says that nothing needs attention when no account is dropping or ending its trial", async () => {
    installFakeApi({ [OVERVIEW_ROUTE]: jsonReply(overview()) });

    renderScreen(<OverviewScreen />, { path: "/admin" });

    const dropping = await screen.findByRole("region", { name: text.droppingTitle });
    expect(within(dropping).getByText(text.droppingEmpty)).toBeVisible();
    expect(within(dropping).getByRole("link", { name: text.seeAll })).toHaveAttribute(
      "href",
      "/admin/comptes?filtre=dropping",
    );
    expect(within(section(text.trialsTitle)).getByText(text.trialsEmpty)).toBeVisible();
    expect(within(section(text.movementsTitle)).getByText(text.movementsEmpty)).toBeVisible();
    expect(screen.getByText(text.trialHint(0))).toBeVisible();
  });

  it("shows the error with the short trace id and loads the overview again on retry", async () => {
    const api = installFakeApi({ [OVERVIEW_ROUTE]: errorReply("internal", TRACE_ID) });

    const { user } = renderScreen(<OverviewScreen />, { path: "/admin" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(OVERVIEW_ROUTE, jsonReply(overview()));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByRole("region", { name: text.droppingTitle })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the counts, the dropping accounts, the ending trials and the last movements", async () => {
    installFakeApi({
      [OVERVIEW_ROUTE]: jsonReply(
        overview({
          counts: { all: 42, trial: 7, dropping: 3, endingSoon: 2, activePeople: 118 },
          dropping: [
            accountSummary("account-1", "Ramonage Martin", {
              trend: DROPPING_TREND,
              isInTrial: false,
            }),
          ],
          endingTrials: [
            accountSummary("account-2", "Fumisterie Leroy", {
              trialEndsAt: "2026-10-27T10:00:00.000Z",
            }),
          ],
          movements: [journalEntry("entry-1", { action: "organization.created" })],
        }),
      ),
    });

    renderScreen(<OverviewScreen />, { path: "/admin" });

    const trialTile = await screen.findByRole("link", { name: new RegExp(text.trial) });
    expect(trialTile).toHaveAttribute("href", "/admin/comptes?filtre=trial");
    expect(trialTile).toHaveTextContent("7");
    expect(trialTile).toHaveTextContent(text.trialHint(2));
    expect(screen.getByRole("link", { name: new RegExp(text.accountsHint) })).toHaveTextContent(
      "42",
    );
    expect(screen.getByText("118")).toBeVisible();

    const dropping = section(text.droppingTitle);
    const droppingAccount = within(dropping).getByRole("link", { name: /Ramonage Martin/ });
    expect(droppingAccount).toHaveAttribute("href", "/admin/comptes/account-1");
    expect(droppingAccount).toHaveTextContent("−60 %");

    const trials = section(text.trialsTitle);
    const endingTrial = within(trials).getByRole("link", { name: /Fumisterie Leroy/ });
    expect(endingTrial).toHaveAttribute("href", "/admin/comptes/account-2");
    expect(endingTrial).toHaveTextContent(text.endsOn("27 oct."));

    const movements = section(text.movementsTitle);
    expect(within(movements).getByText("Paul Martin")).toBeVisible();
    expect(within(movements).getByRole("link", { name: "Ramonage Martin" })).toHaveAttribute(
      "href",
      "/admin/comptes/account-1",
    );
    expect(within(movements).getByRole("link", { name: text.journalLink })).toHaveAttribute(
      "href",
      "/admin/journal",
    );
  });
});
