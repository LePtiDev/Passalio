import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { serverCustomerRecord } from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { newOrganizationId, seedLocalDatabase } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { customersFr } from "../../fr";
import { CustomerListScreen } from "./customer-list-screen";

describe("CustomerListScreen company isolation", () => {
  it("lists only the customers of the company the user is signed in to", async () => {
    const organizationId = newOrganizationId();
    await seedLocalDatabase(newOrganizationId(), {
      customers: [serverCustomerRecord("customer-9", "Girard")],
      lastSyncedAt: "2026-10-22T10:00:00.000Z",
    });
    await seedLocalDatabase(organizationId, {
      customers: [serverCustomerRecord("customer-1", "Moreau")],
      lastSyncedAt: "2026-10-22T10:00:00.000Z",
    });
    installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });

    renderScreen(<CustomerListScreen />, { path: "/clients", organizationId });

    expect(await screen.findByRole("link", { name: /Moreau/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Girard/ })).not.toBeInTheDocument();
    expect(screen.getByText(customersFr.list.subtitle(1, 0))).toBeInTheDocument();
  });
});
