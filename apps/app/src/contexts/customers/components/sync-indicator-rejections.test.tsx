import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { localDatabaseOf } from "@/lib/db/local-database";
import { installFakeApi } from "@/test-support/fake-api";
import { newOrganizationId } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { pushReply, SYNC_PUSH_ROUTE } from "@/test-support/sync-push-replies";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { createCustomer } from "../customer-store";
import { customersFr } from "../fr";
import { SyncPill } from "./sync-indicator";

describe("SyncPill rejections", () => {
  it("tells the user in the sync indicator that the server refused a change", async () => {
    const organizationId = newOrganizationId();
    await createCustomer(
      localDatabaseOf(organizationId),
      { userId: "user-1", organizationId },
      { customer: { kind: "individual", lastName: "Durand" } },
    );
    installFakeApi({
      [SYNC_PUSH_ROUTE]: pushReply({ create_customer: "forbidden" }),
      [SYNC_PULL_ROUTE]: pulledChangesReply(),
    });

    renderScreen(<SyncPill />, { path: "/clients", organizationId });

    await waitFor(async () => {
      expect(await localDatabaseOf(organizationId).rejections.count()).toBe(1);
    });
    expect(await screen.findByText(customersFr.sync.upToDate)).toBeVisible();
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(customersFr.sync.rejected(1));
    });
  });
});
