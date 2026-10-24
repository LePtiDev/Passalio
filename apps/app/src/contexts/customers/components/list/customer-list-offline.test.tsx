import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { localDatabaseOf } from "@/lib/db/local-database";
import { serverCustomerRecord, serverSiteRecord } from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { newOrganizationId, seedLocalDatabase } from "@/test-support/local-seeds";
import { goOffline } from "@/test-support/network";
import { renderScreen } from "@/test-support/render-screen";
import { heldPushReply, SYNC_PUSH_ROUTE } from "@/test-support/sync-push-replies";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { createCustomer } from "../../customer-store";
import { customersFr } from "../../fr";
import { CustomerListScreen } from "./customer-list-screen";

const text = customersFr.sync;

const LAST_SYNC = "2026-10-22T10:00:00.000Z";

const seedSyncedCustomers = (organizationId: string) =>
  seedLocalDatabase(organizationId, {
    customers: [
      serverCustomerRecord("customer-1", "Moreau"),
      serverCustomerRecord("customer-2", "Lefèvre"),
    ],
    sites: [serverSiteRecord("site-1", "customer-1")],
    lastSyncedAt: LAST_SYNC,
  });

const createLocalCustomer = (organizationId: string, lastName: string) =>
  createCustomer(
    localDatabaseOf(organizationId),
    { userId: "user-1", organizationId },
    { customer: { kind: "individual", lastName } },
  );

const renderList = (organizationId: string) =>
  renderScreen(<CustomerListScreen />, { path: "/clients", organizationId });

describe("CustomerListScreen offline and sync states", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the customers kept on the device without calling the network when offline", async () => {
    const organizationId = newOrganizationId();
    await seedSyncedCustomers(organizationId);
    goOffline();
    const api = installFakeApi();

    renderList(organizationId);

    expect(await screen.findByRole("link", { name: /Moreau/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Lefèvre/ })).toBeVisible();
    expect(screen.getByText(text.offlineTitle)).toBeVisible();
    expect(screen.getByText(text.offlineText(0))).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(api.requests).toEqual([]);
  });

  it("marks a customer created offline as waiting to be sent and counts it", async () => {
    const organizationId = newOrganizationId();
    await seedSyncedCustomers(organizationId);
    await createLocalCustomer(organizationId, "Durand");
    goOffline();
    installFakeApi();

    renderList(organizationId);

    const durand = await screen.findByRole("link", { name: /Durand/ });
    expect(within(durand).getByText(text.pendingBadge)).toBeVisible();
    const moreau = screen.getByRole("link", { name: /Moreau/ });
    expect(within(moreau).queryByText(text.pendingBadge)).not.toBeInTheDocument();
    expect(screen.getByText(text.offlineText(1))).toBeVisible();
    expect(screen.getAllByText(text.offline(1)).length).toBeGreaterThan(0);
  });

  it("drops the waiting badge once the server has accepted the change", async () => {
    const organizationId = newOrganizationId();
    await seedSyncedCustomers(organizationId);
    await createLocalCustomer(organizationId, "Durand");
    const push = heldPushReply();
    installFakeApi({ [SYNC_PUSH_ROUTE]: push.reply, [SYNC_PULL_ROUTE]: pulledChangesReply() });

    renderList(organizationId);

    const durand = await screen.findByRole("link", { name: /Durand/ });
    expect(within(durand).getByText(text.pendingBadge)).toBeVisible();
    expect(screen.getAllByText(text.pending(1)).length).toBeGreaterThan(0);

    push.release();

    await waitFor(() => {
      expect(within(durand).queryByText(text.pendingBadge)).not.toBeInTheDocument();
    });
    expect((await screen.findAllByText(text.upToDate)).length).toBeGreaterThan(0);
  });
});
