import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { serverCustomerRecord, serverSiteRecord } from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { newOrganizationId, seedLocalDatabase } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { customersFr } from "../../fr";
import { CustomerListScreen } from "./customer-list-screen";

const text = customersFr.list;

const renderSeededList = async () => {
  const organizationId = newOrganizationId();
  await seedLocalDatabase(organizationId, {
    customers: [
      { ...serverCustomerRecord("customer-1", "Moreau"), phone: "06 12 34 56 78" },
      serverCustomerRecord("customer-2", "Lefèvre"),
    ],
    sites: [
      serverSiteRecord("site-1", "customer-1"),
      { ...serverSiteRecord("site-2", "customer-2"), postalCode: "69001", city: "Lyon" },
    ],
    lastSyncedAt: "2026-10-22T10:00:00.000Z",
  });
  installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });
  const rendered = renderScreen(<CustomerListScreen />, { path: "/clients", organizationId });
  await screen.findByRole("link", { name: /Moreau/ });
  return rendered;
};

const search = async ({ user }: Awaited<ReturnType<typeof renderSeededList>>, query: string) => {
  await user.type(screen.getByRole("searchbox", { name: text.searchLabel }), query);
};

describe("CustomerListScreen search", () => {
  it("finds a customer by the city of its site", async () => {
    const rendered = await renderSeededList();

    await search(rendered, "Lyon");

    expect(await screen.findByRole("link", { name: /Lefèvre/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Moreau/ })).not.toBeInTheDocument();
  });

  it("finds a customer by phone number", async () => {
    const rendered = await renderSeededList();

    await search(rendered, "0612 34");

    expect(await screen.findByRole("link", { name: /Moreau/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Lefèvre/ })).not.toBeInTheDocument();
  });

  it("offers to create the customer that the search did not find, or to clear it", async () => {
    const rendered = await renderSeededList();

    await search(rendered, "Durand");

    const title = await screen.findByRole("heading", { name: text.searchEmptyTitle("Durand") });
    const card = title.closest("div");
    if (card === null) {
      throw new Error("search empty state is not inside a card");
    }
    expect(within(card).getByText(text.searchEmptyText)).toBeVisible();
    expect(
      within(card).getByRole("link", { name: text.createFromSearch("Durand") }),
    ).toHaveAttribute("href", "/clients/nouveau?nom=Durand");

    await rendered.user.click(within(card).getByRole("button", { name: text.clearSearch }));

    expect(await screen.findByRole("link", { name: /Lefèvre/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Moreau/ })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: text.searchLabel })).toHaveValue("");
  });
});
