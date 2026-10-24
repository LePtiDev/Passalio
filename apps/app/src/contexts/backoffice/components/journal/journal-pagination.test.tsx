import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { journalEntry } from "@/test-support/backoffice-records";
import { installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { JournalScreen } from "./journal-screen";

const JOURNAL_ROUTE = "GET /api/admin/journal";

describe("JournalScreen pagination", () => {
  it("stops at the last page and goes back to the first page", async () => {
    const api = installFakeApi({
      [JOURNAL_ROUTE]: (request) =>
        request.search.get("cursor") === "cursor-older"
          ? jsonReply({
              entries: [journalEntry("entry-older", { action: "organization.logo_updated" })],
              nextCursor: null,
            })
          : jsonReply({
              entries: [journalEntry("entry-newer", { action: "organization.created" })],
              nextCursor: "cursor-older",
            }),
    });

    const { user } = renderScreen(<JournalScreen />, { path: "/admin/journal" });

    expect(await screen.findByText(/a créé l'entreprise/)).toBeVisible();
    const pagination = screen.getByRole("navigation", { name: fr.pagination.label });
    const previous = within(pagination).getByRole("button", { name: fr.pagination.previous });
    const next = within(pagination).getByRole("button", { name: fr.pagination.next });
    expect(next).toBeEnabled();

    await user.click(next);

    expect(await screen.findByText(/a changé le logo de/)).toBeVisible();
    await waitFor(() => expect(next).toBeDisabled());
    expect(previous).toBeEnabled();

    await user.click(previous);

    expect(await screen.findByText(/a créé l'entreprise/)).toBeVisible();
    expect(screen.queryByText(/a changé le logo de/)).toBeNull();
    expect(previous).toBeDisabled();
    expect(api.requestsTo(JOURNAL_ROUTE).map(({ search }) => search.get("cursor"))).toContain(
      "cursor-older",
    );
  });
});
