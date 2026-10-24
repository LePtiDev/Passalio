import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  serverCustomerRecord,
  serverEquipmentRecord,
  serverSiteRecord,
} from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { newOrganizationId, seedLocalDatabase } from "@/test-support/local-seeds";
import { goOffline } from "@/test-support/network";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { makeNetworkUnreachable } from "@/test-support/unreachable-network";
import { updateCustomer } from "../../customer-store";
import { customersFr } from "../../fr";
import { CustomerFileScreen } from "./customer-file-screen";

const CUSTOMER_ID = "customer-1";

const seedMoreau = (organizationId: string) =>
  seedLocalDatabase(organizationId, {
    customers: [serverCustomerRecord(CUSTOMER_ID, "Moreau")],
    sites: [serverSiteRecord("site-1", CUSTOMER_ID)],
    equipments: [serverEquipmentRecord("equipment-1", "site-1")],
    lastSyncedAt: "2026-10-22T10:00:00.000Z",
  });

const renderFile = (organizationId: string) =>
  renderScreen(<CustomerFileScreen customerId={CUSTOMER_ID} />, {
    path: `/clients/${CUSTOMER_ID}`,
    organizationId,
  });

describe("CustomerFileScreen on the field", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the customer file offline with the number of changes left to send", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreau(organizationId);
    await updateCustomer(database, CUSTOMER_ID, { phone: "06 12 34 56 78" });
    goOffline();
    const api = installFakeApi();

    renderFile(organizationId);

    expect((await screen.findAllByRole("heading", { name: "Moreau" })).length).toBeGreaterThan(0);
    expect(screen.getByText("Chaudière")).toBeVisible();
    expect(screen.getAllByRole("link", { name: customersFr.file.call })[0]).toHaveAttribute(
      "href",
      "tel:06 12 34 56 78",
    );
    expect((await screen.findAllByText(customersFr.sync.offline(1))).length).toBeGreaterThan(0);
    expect(api.requests.filter(({ path }) => path.startsWith("/api/sync"))).toEqual([]);
  });

  it("shows the customer file and counts it as offline when the server cannot be reached", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreau(organizationId);
    await updateCustomer(database, CUSTOMER_ID, { phone: "06 12 34 56 78" });
    makeNetworkUnreachable();

    renderFile(organizationId);

    expect((await screen.findAllByRole("heading", { name: "Moreau" })).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(customersFr.sync.offline(1))).length).toBeGreaterThan(0);
    expect(screen.queryByText(customersFr.sync.error)).not.toBeInTheDocument();
    expect(await database.outbox.count()).toBe(1);
  });

  it("does not show a customer kept on the device for another company", async () => {
    const otherOrganizationId = newOrganizationId();
    await seedMoreau(otherOrganizationId);
    installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });

    renderFile(newOrganizationId());

    expect(
      await screen.findByRole("heading", { name: customersFr.file.notFoundTitle }),
    ).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Moreau" })).not.toBeInTheDocument();
  });
});
