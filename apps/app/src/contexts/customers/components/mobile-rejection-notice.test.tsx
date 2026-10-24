import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { localDatabaseOf } from "@/lib/db/local-database";
import { installFakeApi } from "@/test-support/fake-api";
import { showMobileViewport } from "@/test-support/happy-dom-window";
import { newOrganizationId } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { customersFr } from "../fr";
import { MobileRejectionNotice } from "./mobile-rejection-notice";

const text = customersFr.sync;

const seedRejections = (organizationId: string, count: number) =>
  localDatabaseOf(organizationId).rejections.bulkPut(
    Array.from({ length: count }, (_, index) => ({
      id: `rejection-${index}`,
      description: "update_customer",
      error: "not_found",
      at: "2026-10-24T08:00:00.000Z",
    })),
  );

describe("MobileRejectionNotice", () => {
  it("shows nothing while the server has refused no change", async () => {
    showMobileViewport();
    const organizationId = newOrganizationId();
    installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });

    renderScreen(<MobileRejectionNotice />, { path: "/clients", organizationId });

    await waitFor(() => expect(screen.queryByText(text.rejected(1))).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: text.acknowledgeRejections })).toBeNull();
  });

  it("leaves the refused changes to the sync indicator on a computer", async () => {
    const organizationId = newOrganizationId();
    await seedRejections(organizationId, 1);
    installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });

    renderScreen(<MobileRejectionNotice />, { path: "/clients", organizationId });

    await waitFor(async () => {
      expect(await localDatabaseOf(organizationId).rejections.count()).toBe(1);
    });
    expect(screen.queryByText(text.rejected(1))).not.toBeInTheDocument();
  });

  it("counts the refused changes", async () => {
    showMobileViewport();
    const organizationId = newOrganizationId();
    await seedRejections(organizationId, 2);
    installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });

    renderScreen(<MobileRejectionNotice />, { path: "/clients", organizationId });

    expect(await screen.findByText(text.rejected(2))).toBeVisible();
  });

  it("forgets the refused changes once the user acknowledges them", async () => {
    showMobileViewport();
    const organizationId = newOrganizationId();
    await seedRejections(organizationId, 1);
    installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });

    const { user } = renderScreen(<MobileRejectionNotice />, { path: "/clients", organizationId });
    await user.click(await screen.findByRole("button", { name: text.acknowledgeRejections }));

    await waitFor(() => expect(screen.queryByText(text.rejected(1))).not.toBeInTheDocument());
    expect(await localDatabaseOf(organizationId).rejections.count()).toBe(0);
  });
});
