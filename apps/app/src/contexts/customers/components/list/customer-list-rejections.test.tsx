import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { localDatabaseOf } from "@/lib/db/local-database";
import { serverCustomerRecord } from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { newOrganizationId, seedLocalDatabase } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { pushReply, SYNC_PUSH_ROUTE } from "@/test-support/sync-push-replies";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { createCustomer } from "../../customer-store";
import { customersFr } from "../../fr";
import { CustomerListScreen } from "./customer-list-screen";

const seedSyncedCustomers = (organizationId: string) =>
  seedLocalDatabase(organizationId, {
    customers: [
      serverCustomerRecord("customer-1", "Moreau"),
      serverCustomerRecord("customer-2", "Lefèvre"),
    ],
    lastSyncedAt: "2026-10-22T10:00:00.000Z",
  });

const createLocalCustomer = (organizationId: string, lastName: string) =>
  createCustomer(
    localDatabaseOf(organizationId),
    { userId: "user-1", organizationId },
    { customer: { kind: "individual", lastName } },
  );

describe("CustomerListScreen sync rejections", () => {
  it("tells the user when the server refuses a change made on the device", async () => {
    const organizationId = newOrganizationId();
    await seedSyncedCustomers(organizationId);
    await createLocalCustomer(organizationId, "Durand");
    installFakeApi({
      [SYNC_PUSH_ROUTE]: pushReply({ create_customer: "forbidden" }),
      [SYNC_PULL_ROUTE]: pulledChangesReply(),
    });

    renderScreen(<CustomerListScreen />, { path: "/clients", organizationId });

    await waitFor(async () => {
      expect(await localDatabaseOf(organizationId).rejections.count()).toBe(1);
    });
    expect(await localDatabaseOf(organizationId).customers.count()).toBe(2);
    expect((await screen.findAllByText(customersFr.sync.upToDate)).length).toBeGreaterThan(0);
    expect(await screen.findByRole("link", { name: /Moreau/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Durand/ })).not.toBeInTheDocument();
    expect(await screen.findByText(customersFr.sync.rejected(1))).toBeVisible();
  });
});
