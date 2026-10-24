import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { localDatabaseOf } from "@/lib/db/local-database";
import { addressSearchReply, ADDRESS_SEARCH_ROUTE } from "@/test-support/address-replies";
import { installFakeApi } from "@/test-support/fake-api";
import { newOrganizationId, outboxTypes } from "@/test-support/local-seeds";
import { goOffline } from "@/test-support/network";
import { renderScreen } from "@/test-support/render-screen";
import { heldPushReply, SYNC_PUSH_ROUTE } from "@/test-support/sync-push-replies";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { dismissAllToasts } from "@/test-support/toasts";
import { customersFr } from "../../fr";
import { NewCustomerScreen } from "./new-customer-screen";

const text = customersFr.form;

const installApi = () =>
  installFakeApi({
    [SYNC_PULL_ROUTE]: pulledChangesReply(),
    [SYNC_PUSH_ROUTE]: heldPushReply().reply,
    [ADDRESS_SEARCH_ROUTE]: addressSearchReply(),
  });

const renderForm = (organizationId: string, initialName = "") =>
  renderScreen(<NewCustomerScreen initialName={initialName} />, {
    path: "/clients/nouveau",
    organizationId,
  });

type Rendered = ReturnType<typeof renderForm>;

const typeAddressByHand = async ({ user }: Rendered) => {
  await user.type(screen.getByLabelText(text.address), "12 rue des Lilas");
  await user.click(await screen.findByRole("button", { name: text.manualEntry }));
  await user.type(await screen.findByLabelText(text.postalCode), "94200");
  await user.type(screen.getByLabelText(text.city), "Ivry-sur-Seine");
};

const submit = async ({ user }: Rendered) => {
  await user.click(screen.getByRole("button", { name: text.saveCustomer }));
};

describe("NewCustomerScreen", () => {
  afterEach(() => {
    dismissAllToasts();
    vi.restoreAllMocks();
  });

  it("shows what is missing and saves nothing when the form is empty", async () => {
    const organizationId = newOrganizationId();
    installApi();
    const rendered = renderForm(organizationId);
    expect(
      (await screen.findAllByRole("heading", { name: text.customerTitle })).length,
    ).toBeGreaterThan(0);

    await submit(rendered);

    expect(await screen.findByText(text.errors.lastName)).toBeVisible();
    expect(screen.getByText(text.errors.address)).toBeVisible();
    expect(screen.getByText(text.errors.postalCode)).toBeVisible();
    expect(screen.getByText(text.errors.city)).toBeVisible();
    expect(screen.getByLabelText(text.lastName)).toHaveAttribute("aria-invalid", "true");
    expect(await localDatabaseOf(organizationId).customers.count()).toBe(0);
    expect(await outboxTypes(organizationId)).toEqual([]);
    expect(rendered.router.state.location.pathname).toBe("/clients/nouveau");
  });

  it("refuses an incomplete phone number, an invalid email and a short postal code", async () => {
    const organizationId = newOrganizationId();
    installApi();
    const rendered = renderForm(organizationId);
    await rendered.user.type(await screen.findByLabelText(text.lastName), "Moreau");
    await rendered.user.type(screen.getByLabelText(text.phone), "06 12");
    await rendered.user.type(screen.getByLabelText(/Email/), "martine@");
    await rendered.user.type(screen.getByLabelText(text.address), "12 rue des Lilas");
    await rendered.user.click(await screen.findByRole("button", { name: text.manualEntry }));
    await rendered.user.type(await screen.findByLabelText(text.postalCode), "942");
    await rendered.user.type(screen.getByLabelText(text.city), "Ivry-sur-Seine");

    await submit(rendered);

    expect(await screen.findByText(text.errors.phone)).toBeVisible();
    expect(screen.getByText(text.errors.email)).toBeVisible();
    expect(screen.getByText(text.errors.postalCode)).toBeVisible();
    expect(await localDatabaseOf(organizationId).customers.count()).toBe(0);
  });

  it("requires the company name for a professional customer", async () => {
    const organizationId = newOrganizationId();
    installApi();
    const rendered = renderForm(organizationId);
    await rendered.user.click(await screen.findByRole("radio", { name: text.kinds.company }));
    expect(screen.getByLabelText(text.companyName)).toBeVisible();
    expect(screen.queryByLabelText(text.firstName)).not.toBeInTheDocument();

    await submit(rendered);

    expect(await screen.findByText(text.errors.companyName)).toBeVisible();
    expect(screen.queryByText(text.errors.lastName)).not.toBeInTheDocument();
  });

  it("prefills the last name typed in the customer search", async () => {
    installApi();

    renderForm(newOrganizationId(), "Durand");

    expect(await screen.findByLabelText(text.lastName)).toHaveValue("Durand");
  });

  it("creates the customer and its site on the device, queues them and opens the file", async () => {
    const organizationId = newOrganizationId();
    const api = installApi();
    const rendered = renderForm(organizationId);
    await rendered.user.type(await screen.findByLabelText(text.firstName), "Martine");
    await rendered.user.type(screen.getByLabelText(text.lastName), "Moreau");
    await rendered.user.type(screen.getByLabelText(text.phone), "06 12 34 56 78");
    await typeAddressByHand(rendered);

    await submit(rendered);

    expect(await screen.findByText(customersFr.toasts.customerCreated)).toBeVisible();
    const database = localDatabaseOf(organizationId);
    const [customer] = await database.customers.toArray();
    expect(customer).toMatchObject({
      kind: "individual",
      firstName: "Martine",
      lastName: "Moreau",
      phone: "06 12 34 56 78",
    });
    const [site] = await database.sites.toArray();
    expect(site).toMatchObject({
      customerId: customer?.id,
      address: "12 rue des Lilas",
      postalCode: "94200",
      city: "Ivry-sur-Seine",
      buildingType: "house",
    });
    expect(await outboxTypes(organizationId)).toEqual(["create_customer", "add_site"]);
    await waitFor(() => {
      expect(rendered.router.state.location.pathname).toBe(`/clients/${customer?.id ?? ""}`);
    });
    expect(api.requestsTo("POST /api/customers")).toEqual([]);
  });

  it("fills the postal code and the city from an address suggestion", async () => {
    const organizationId = newOrganizationId();
    const api = installApi();
    api.setRoute(
      ADDRESS_SEARCH_ROUTE,
      addressSearchReply([
        { id: "94041_1", name: "12 Rue des Lilas", postcode: "94200", city: "Ivry-sur-Seine" },
      ]),
    );
    const rendered = renderForm(organizationId);

    await rendered.user.type(await screen.findByLabelText(text.address), "12 rue des");
    await rendered.user.click(await screen.findByRole("button", { name: /12 Rue des Lilas/ }));

    expect(await screen.findByLabelText(text.postalCode)).toHaveValue("94200");
    expect(screen.getByLabelText(text.city)).toHaveValue("Ivry-sur-Seine");
    expect(screen.getByLabelText(text.address)).toHaveValue("12 Rue des Lilas");
    expect(api.requestsTo(ADDRESS_SEARCH_ROUTE).at(-1)?.search.get("q")).toBe("12 rue des");
  });

  it("lets the address be typed by hand and saves the customer when offline", async () => {
    const organizationId = newOrganizationId();
    goOffline();
    const api = installApi();
    const rendered = renderForm(organizationId);
    await rendered.user.type(await screen.findByLabelText(text.lastName), "Moreau");
    await rendered.user.type(screen.getByLabelText(text.address), "12 rue des Lilas");
    await rendered.user.type(screen.getByLabelText(text.postalCode), "94200");
    await rendered.user.type(screen.getByLabelText(text.city), "Ivry-sur-Seine");
    expect(screen.queryByRole("button", { name: text.manualEntry })).not.toBeInTheDocument();

    await submit(rendered);

    expect(await screen.findByText(customersFr.toasts.customerCreated)).toBeVisible();
    expect(await outboxTypes(organizationId)).toEqual(["create_customer", "add_site"]);
    expect(api.requests).toEqual([]);
  });

  it("tells the user when the device could not save the customer", async () => {
    const organizationId = newOrganizationId();
    installApi();
    const database = localDatabaseOf(organizationId);
    vi.spyOn(database.customers, "add").mockRejectedValue(new Error("QuotaExceededError"));
    const rendered = renderForm(organizationId);
    await rendered.user.type(await screen.findByLabelText(text.lastName), "Moreau");
    await typeAddressByHand(rendered);

    await submit(rendered);

    expect(await screen.findByText(text.errors.saveFailed)).toBeVisible();
    expect(rendered.router.state.location.pathname).toBe("/clients/nouveau");
    expect(await outboxTypes(organizationId)).toEqual([]);
  });
});
