import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { serverCustomerRecord, serverSiteRecord } from "@/lib/sync/sync-test-records";
import { errorReply, heldReply, installFakeApi } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { customersFr } from "../../fr";
import { CustomerListScreen } from "./customer-list-screen";

const text = customersFr.list;

const TRACE_ID = "4f9c2a1b-7d3e-4c5a-9b8f-0e1d2c3b4a59";

const cardAround = (element: HTMLElement) => {
  const card = element.closest("div");
  if (card === null) {
    throw new Error("element is not inside a card");
  }
  return card;
};

describe("CustomerListScreen", () => {
  it("shows a skeleton of the list while the first sync is running", async () => {
    const pull = heldReply(pulledChangesReply());
    installFakeApi({ [SYNC_PULL_ROUTE]: pull.reply });

    renderScreen(<CustomerListScreen />, { path: "/clients" });

    const skeleton = await screen.findByLabelText(text.loading, { selector: "[aria-busy]" });
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("heading", { name: text.emptyTitle })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    pull.release();

    expect(await screen.findByRole("heading", { name: text.emptyTitle })).toBeVisible();
    expect(screen.queryByLabelText(text.loading, { selector: "[aria-busy]" })).toBeNull();
  });

  it("offers to create the first customer when the company has none", async () => {
    installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });

    const { user, router } = renderScreen(<CustomerListScreen />, { path: "/clients" });

    const emptyCard = cardAround(await screen.findByRole("heading", { name: text.emptyTitle }));
    expect(within(emptyCard).getByText(text.emptyText)).toBeVisible();
    const createLink = within(emptyCard).getByRole("link", { name: text.newCustomer });
    expect(createLink).toHaveAttribute("href", "/clients/nouveau");

    await user.click(createLink);

    expect(router.state.location.pathname).toBe("/clients/nouveau");
  });

  it("shows the error with the short trace id and retries on demand", async () => {
    const api = installFakeApi({ [SYNC_PULL_ROUTE]: errorReply("internal", TRACE_ID) });

    const { user } = renderScreen(<CustomerListScreen />, { path: "/clients" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(text.loadError);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(SYNC_PULL_ROUTE, pulledChangesReply());
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByRole("heading", { name: text.emptyTitle })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists the synced customers with their city and the company totals", async () => {
    installFakeApi({
      [SYNC_PULL_ROUTE]: pulledChangesReply({
        customers: [
          serverCustomerRecord("customer-1", "Moreau"),
          serverCustomerRecord("customer-2", "Lefèvre"),
        ],
        sites: [serverSiteRecord("site-1", "customer-1")],
      }),
    });

    renderScreen(<CustomerListScreen />, { path: "/clients" });

    const moreau = await screen.findByRole("link", { name: /Moreau/ });
    expect(moreau).toHaveAttribute("href", "/clients/customer-1");
    expect(moreau).toHaveTextContent("Ivry-sur-Seine");
    expect(screen.getByRole("link", { name: /Lefèvre/ })).toHaveAttribute(
      "href",
      "/clients/customer-2",
    );
    expect(screen.getByText(text.subtitle(2, 0))).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: text.searchLabel })).toBeVisible();
    expect(screen.queryByRole("heading", { name: text.emptyTitle })).not.toBeInTheDocument();
  });
});
