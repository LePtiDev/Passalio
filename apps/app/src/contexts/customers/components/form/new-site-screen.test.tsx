import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { serverCustomerRecord, serverSiteRecord } from "@/lib/sync/sync-test-records";
import { addressSearchReply, ADDRESS_SEARCH_ROUTE } from "@/test-support/address-replies";
import { installFakeApi } from "@/test-support/fake-api";
import { holdLocalDatabaseOpening } from "@/test-support/local-holds";
import { newOrganizationId, outboxTypes, seedLocalDatabase } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { heldPushReply, SYNC_PUSH_ROUTE } from "@/test-support/sync-push-replies";
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

const renderNewSite = (organizationId: string) => {
  const api = installFakeApi({
    [SYNC_PULL_ROUTE]: pulledChangesReply(),
    [SYNC_PUSH_ROUTE]: heldPushReply().reply,
    [ADDRESS_SEARCH_ROUTE]: addressSearchReply(),
  });
  const rendered = renderScreen(<NewSiteScreen customerId={CUSTOMER_ID} />, {
    path: `/clients/${CUSTOMER_ID}/lieux/nouveau`,
    organizationId,
  });
  return { ...rendered, api };
};

describe("NewSiteScreen", () => {
  afterEach(dismissAllToasts);

  it("shows a form skeleton until the customer is read from the device", async () => {
    const organizationId = newOrganizationId();
    const read = holdLocalDatabaseOpening(await seedMoreau(organizationId));

    renderNewSite(organizationId);

    expect(await screen.findByRole("generic", { busy: true })).toBeInTheDocument();
    expect(screen.queryByLabelText(text.address)).not.toBeInTheDocument();

    read.release();

    expect(await screen.findByLabelText(text.address)).toBeVisible();
  });

  it("explains that the customer does not exist", async () => {
    renderNewSite(newOrganizationId());

    expect(
      await screen.findByRole("heading", { name: customersFr.file.notFoundTitle }),
    ).toBeVisible();
  });

  it("shows what is missing and saves nothing when the address is empty", async () => {
    const organizationId = newOrganizationId();
    await seedMoreau(organizationId);
    const rendered = renderNewSite(organizationId);
    await screen.findByLabelText(text.address);

    await rendered.user.click(screen.getByRole("button", { name: text.saveSite }));

    expect(await screen.findByText(text.errors.address)).toBeVisible();
    expect(screen.getByText(text.errors.postalCode)).toBeVisible();
    expect(screen.getByText(text.errors.city)).toBeVisible();
    expect(await outboxTypes(organizationId)).toEqual([]);
  });

  it("adds the site to the customer on the device, queues it and returns to the file", async () => {
    const organizationId = newOrganizationId();
    const database = await seedMoreau(organizationId);
    const rendered = renderNewSite(organizationId);
    const { user } = rendered;
    await user.type(await screen.findByLabelText(/Nom du lieu/), "Appartement loué");
    await user.type(screen.getByLabelText(text.address), "3 avenue Foch");
    await user.click(await screen.findByRole("button", { name: text.manualEntry }));
    await user.type(await screen.findByLabelText(text.postalCode), "75016");
    await user.type(screen.getByLabelText(text.city), "Paris");
    await user.click(screen.getByRole("radio", { name: "Appartement" }));
    await user.type(screen.getByLabelText(/^Occupant/), "Paul Girard");

    await user.click(screen.getByRole("button", { name: text.saveSite }));

    expect(await screen.findByText(customersFr.toasts.siteCreated)).toBeVisible();
    await waitFor(() => {
      expect(rendered.router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}`);
    });
    const sites = await database.sites.where("customerId").equals(CUSTOMER_ID).toArray();
    expect(sites).toHaveLength(2);
    expect(sites.find(({ id }) => id !== "site-1")).toMatchObject({
      label: "Appartement loué",
      address: "3 avenue Foch",
      postalCode: "75016",
      city: "Paris",
      buildingType: "apartment",
      occupantName: "Paul Girard",
    });
    expect(await outboxTypes(organizationId)).toEqual(["add_site"]);
    expect(rendered.api.requestsTo("POST /api/customers/customer-1/sites")).toEqual([]);
  });
});
