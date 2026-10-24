import type { JournalPageResponse } from "@passalio/shared";
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { journalEntry } from "@/test-support/backoffice-records";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { backofficeFr } from "../../fr";
import { JournalScreen } from "./journal-screen";

const text = backofficeFr.journal;

const JOURNAL_ROUTE = "GET /api/admin/journal";

const TRACE_ID = "5e4d3c2b-1a09-4f8e-9d7c-6b5a49382716";

const DAY_MS = 24 * 60 * 60 * 1000;

const journalPage = (overrides: Partial<JournalPageResponse> = {}): JournalPageResponse => ({
  entries: [],
  nextCursor: null,
  ...overrides,
});

describe("JournalScreen", () => {
  it("shows a skeleton of the timeline while the journal loads", async () => {
    const reply = heldReply(jsonReply(journalPage()));
    installFakeApi({ [JOURNAL_ROUTE]: reply.reply });

    renderScreen(<JournalScreen />, { path: "/admin/journal" });

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.queryByText(text.empty)).not.toBeInTheDocument();

    reply.release();

    expect(await screen.findByText(text.empty)).toBeVisible();
    expect(busyRegions()).toHaveLength(0);
  });

  it("explains what the journal records when it is empty", async () => {
    installFakeApi({ [JOURNAL_ROUTE]: jsonReply(journalPage()) });

    renderScreen(<JournalScreen />, { path: "/admin/journal" });

    expect(await screen.findByText(text.empty)).toBeVisible();
    expect(screen.getByText(text.emptyText)).toBeVisible();
    expect(screen.queryByRole("navigation", { name: fr.pagination.label })).toBeNull();
  });

  it("shows the error with the short trace id and loads the journal again on retry", async () => {
    const api = installFakeApi({ [JOURNAL_ROUTE]: errorReply("internal", TRACE_ID) });

    const { user } = renderScreen(<JournalScreen />, { path: "/admin/journal" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(JOURNAL_ROUTE, jsonReply(journalPage()));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByText(text.empty)).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("groups the entries by day and names who acted, on which company and on whose behalf", async () => {
    const now = Date.now();
    installFakeApi({
      [JOURNAL_ROUTE]: jsonReply(
        journalPage({
          entries: [
            journalEntry("entry-1", {
              action: "organization.updated",
              createdAt: new Date(now).toISOString(),
              actorName: "Paul Martin",
              impersonatorName: "Quentin Admin",
            }),
            journalEntry("entry-2", {
              action: "platform.role_granted",
              createdAt: new Date(now - DAY_MS).toISOString(),
              organization: null,
              actorName: null,
              targetName: "Léa Commerciale",
              data: { role: "sales" },
            }),
          ],
        }),
      ),
    });

    renderScreen(<JournalScreen />, { path: "/admin/journal" });

    const today = await screen.findByRole("region", { name: /^Aujourd'hui · / });
    expect(today).toHaveTextContent("Paul Martin a modifié les informations de Ramonage Martin");
    expect(today).toHaveTextContent(text.onBehalf("Quentin Admin").trim());
    expect(within(today).getByRole("link", { name: "Ramonage Martin" })).toHaveAttribute(
      "href",
      "/admin/comptes/account-1",
    );
    const yesterday = screen.getByRole("region", { name: /^Hier · / });
    expect(yesterday).toHaveTextContent(
      `${text.command} a donné le rôle commercial à Léa Commerciale`,
    );
  });

  it("loads the next page of the journal with the server cursor", async () => {
    const api = installFakeApi({
      [JOURNAL_ROUTE]: (request) =>
        request.search.get("cursor") === "cursor-2"
          ? jsonReply(
              journalPage({
                entries: [journalEntry("entry-old", { action: "organization.logo_updated" })],
              }),
            )
          : jsonReply(
              journalPage({
                entries: [journalEntry("entry-new", { action: "organization.created" })],
                nextCursor: "cursor-2",
              }),
            ),
    });

    const { user } = renderScreen(<JournalScreen />, { path: "/admin/journal" });

    expect(await screen.findByText(/a créé l'entreprise/)).toBeVisible();
    const pagination = screen.getByRole("navigation", { name: fr.pagination.label });
    expect(within(pagination).getByRole("button", { name: fr.pagination.previous })).toBeDisabled();

    await user.click(within(pagination).getByRole("button", { name: fr.pagination.next }));

    expect(await screen.findByText(/a changé le logo de/)).toBeVisible();
    expect(screen.queryByText(/a créé l'entreprise/)).toBeNull();
    expect(api.requestsTo(JOURNAL_ROUTE).at(-1)?.search.get("cursor")).toBe("cursor-2");
  });
});
