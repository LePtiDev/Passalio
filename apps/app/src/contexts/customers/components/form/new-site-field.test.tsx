import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { serverCustomerRecord, serverSiteRecord } from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { newOrganizationId, outboxTypes, seedLocalDatabase } from "@/test-support/local-seeds";
import { goOffline } from "@/test-support/network";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { dismissAllToasts } from "@/test-support/toasts";
import { customersFr } from "../../fr";
import { NewSiteScreen } from "./new-site-screen";

const text = customersFr.form;

const CUSTOMER_ID = "customer-1";

const seedMoreau = (organizationId: string) =>
  seedLocalDatabase(organizationId, {
    customers: [serverCustomerRecord(CUSTOMER_ID, "Moreau")],
    sites: [serverSiteRecord("site-1", CUSTOMER_ID)],
  });

const renderNewSite = (organizationId: string) =>
  renderScreen(<NewSiteScreen customerId={CUSTOMER_ID} />, {
    path: `/clients/${CUSTOMER_ID}/lieux/nouveau`,
    organizationId,
  });

describe("NewSiteScreen on the field", () => {
  afterEach(() => {
    dismissAllToasts();
    vi.restoreAllMocks();
  });

  it("offers the manual address at once and saves the site offline without calling the network", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreau(organizationId);
    goOffline();
    const api = installFakeApi();
    const { user, router } = renderNewSite(organizationId);

    await user.type(await screen.findByLabelText(text.address), "3 avenue Foch");
    expect(screen.queryByRole("button", { name: text.manualEntry })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(text.postalCode), "75016");
    await user.type(screen.getByLabelText(text.city), "Paris");
    await user.click(screen.getByRole("button", { name: text.saveSite }));

    expect(await screen.findByText(customersFr.toasts.siteCreated)).toBeVisible();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}`);
    });
    expect(await database.sites.where("customerId").equals(CUSTOMER_ID).count()).toBe(2);
    expect(await outboxTypes(organizationId)).toEqual(["add_site"]);
    expect(api.requests).toEqual([]);
  });

  it("tells the user the site was not saved and adds nothing", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreau(organizationId);
    vi.spyOn(database.outbox, "add").mockRejectedValue(new Error("QuotaExceededError"));
    goOffline();
    installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });
    const { user, router } = renderNewSite(organizationId);

    await user.type(await screen.findByLabelText(text.address), "3 avenue Foch");
    await user.type(screen.getByLabelText(text.postalCode), "75016");
    await user.type(screen.getByLabelText(text.city), "Paris");
    await user.click(screen.getByRole("button", { name: text.saveSite }));

    expect(await screen.findByText(text.errors.saveFailed)).toBeVisible();
    expect(screen.queryByText(customersFr.toasts.siteCreated)).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}/lieux/nouveau`);
    expect(await database.sites.where("customerId").equals(CUSTOMER_ID).count()).toBe(1);
    expect(await outboxTypes(organizationId)).toEqual([]);
  });
});
