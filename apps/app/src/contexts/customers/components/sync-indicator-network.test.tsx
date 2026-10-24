import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { localDatabaseOf } from "@/lib/db/local-database";
import { newOrganizationId } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { makeNetworkUnreachable } from "@/test-support/unreachable-network";
import { createCustomer } from "../customer-store";
import { customersFr } from "../fr";
import { SyncPill } from "./sync-indicator";

const text = customersFr.sync;

describe("SyncPill when the server cannot be reached", () => {
  it("shows offline with the pending count instead of a sync failure", async () => {
    const organizationId = newOrganizationId();
    await createCustomer(
      localDatabaseOf(organizationId),
      { userId: "user-1", organizationId },
      { customer: { kind: "individual", lastName: "Moreau" } },
    );
    const fetch = makeNetworkUnreachable();

    renderScreen(<SyncPill />, { path: "/clients", organizationId });

    expect(await screen.findByText(text.offline(1))).toBeVisible();
    expect(screen.queryByText(text.error)).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalled();
    expect(await localDatabaseOf(organizationId).outbox.count()).toBe(1);
  });
});
