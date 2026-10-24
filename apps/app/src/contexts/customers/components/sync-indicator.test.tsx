import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { localDatabaseOf } from "@/lib/db/local-database";
import { errorReply, heldReply, installFakeApi } from "@/test-support/fake-api";
import { newOrganizationId } from "@/test-support/local-seeds";
import { goOffline, goOnline } from "@/test-support/network";
import { renderScreen } from "@/test-support/render-screen";
import { heldPushReply, pushReply, SYNC_PUSH_ROUTE } from "@/test-support/sync-push-replies";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { createCustomer } from "../customer-store";
import { customersFr } from "../fr";
import { SyncPill } from "./sync-indicator";

const text = customersFr.sync;

const queueOneCustomer = async (organizationId: string) => {
  await createCustomer(
    localDatabaseOf(organizationId),
    { userId: "user-1", organizationId },
    { customer: { kind: "individual", lastName: "Moreau" } },
  );
};

const renderPill = (organizationId: string) =>
  renderScreen(<SyncPill />, { path: "/clients", organizationId });

describe("SyncPill", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("says the device was never synced until the first sync ends, then up to date", async () => {
    const pull = heldReply(pulledChangesReply());
    installFakeApi({ [SYNC_PULL_ROUTE]: pull.reply });

    renderPill(newOrganizationId());

    expect(await screen.findByRole("status")).toHaveTextContent(text.neverSynced);

    pull.release();

    expect(await screen.findByText(text.upToDate)).toBeVisible();
  });

  it("counts the changes waiting to be sent until the server accepts them", async () => {
    const organizationId = newOrganizationId();
    await queueOneCustomer(organizationId);
    const push = heldPushReply();
    const api = installFakeApi({
      [SYNC_PUSH_ROUTE]: push.reply,
      [SYNC_PULL_ROUTE]: pulledChangesReply(),
    });

    renderPill(organizationId);

    expect(await screen.findByText(text.pending(1))).toBeVisible();
    expect(api.requestsTo(SYNC_PUSH_ROUTE)).toHaveLength(1);

    push.release();

    expect(await screen.findByText(text.upToDate)).toBeVisible();
    expect(await localDatabaseOf(organizationId).outbox.count()).toBe(0);
  });

  it("shows offline with the pending count and sends everything when the network is back", async () => {
    const organizationId = newOrganizationId();
    await queueOneCustomer(organizationId);
    goOffline();
    const api = installFakeApi({
      [SYNC_PUSH_ROUTE]: pushReply(),
      [SYNC_PULL_ROUTE]: pulledChangesReply(),
    });

    renderPill(organizationId);

    expect(await screen.findByText(text.offline(1))).toBeVisible();
    expect(api.requests).toEqual([]);

    goOnline();

    expect(await screen.findByText(text.upToDate)).toBeVisible();
    expect(api.requestsTo(SYNC_PUSH_ROUTE)).toHaveLength(1);
    expect(await localDatabaseOf(organizationId).outbox.count()).toBe(0);
  });

  it("shows that the sync failed when the server answers with an error", async () => {
    installFakeApi({
      [SYNC_PULL_ROUTE]: errorReply("internal", "9a8b7c6d-0000-4000-8000-000000000000"),
    });

    renderPill(newOrganizationId());

    expect(await screen.findByText(text.error)).toBeVisible();
  });
});
