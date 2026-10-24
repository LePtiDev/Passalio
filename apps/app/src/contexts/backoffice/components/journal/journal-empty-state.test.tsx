import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { backofficeFr } from "../../fr";
import { JournalScreen } from "./journal-screen";

const text = backofficeFr.journal;

const emptyStateOf = (message: HTMLElement) => {
  const frame = message.parentElement;
  if (frame === null) {
    throw new Error("the empty journal message has no frame");
  }
  return frame;
};

describe("JournalScreen empty state", () => {
  it("offers a main action next to the empty journal message", async () => {
    installFakeApi({ "GET /api/admin/journal": jsonReply({ entries: [], nextCursor: null }) });

    renderScreen(<JournalScreen />, { path: "/admin/journal" });

    const emptyState = emptyStateOf(await screen.findByText(text.empty));
    const actions = [
      ...within(emptyState).queryAllByRole("link"),
      ...within(emptyState).queryAllByRole("button"),
    ];
    expect(actions).not.toHaveLength(0);
  });
});
