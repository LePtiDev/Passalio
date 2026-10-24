import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { serverCustomerRecord } from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { holdLocalDatabaseOpening } from "@/test-support/local-holds";
import { newOrganizationId, outboxTypes, seedLocalDatabase } from "@/test-support/local-seeds";
import { renderScreen } from "@/test-support/render-screen";
import { heldPushReply, SYNC_PUSH_ROUTE } from "@/test-support/sync-push-replies";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { dismissAllToasts } from "@/test-support/toasts";
import { customersFr } from "../../fr";
import { EditCustomerScreen } from "./edit-customer-screen";

const text = customersFr.form;

const CUSTOMER_ID = "customer-1";

const moreau = {
  ...serverCustomerRecord(CUSTOMER_ID, "Moreau"),
  firstName: "Martine",
  phone: "06 12 34 56 78",
  email: "martine@exemple.fr",
};

const renderEdit = (organizationId: string) => {
  const api = installFakeApi({
    [SYNC_PULL_ROUTE]: pulledChangesReply(),
    [SYNC_PUSH_ROUTE]: heldPushReply().reply,
  });
  const rendered = renderScreen(<EditCustomerScreen customerId={CUSTOMER_ID} />, {
    path: `/clients/${CUSTOMER_ID}/modifier`,
    organizationId,
  });
  return { ...rendered, api };
};

describe("EditCustomerScreen", () => {
  afterEach(dismissAllToasts);

  it("shows a form skeleton until the customer is read from the device", async () => {
    const organizationId = newOrganizationId();
    const database = await seedLocalDatabase(organizationId, { customers: [moreau] });
    const read = holdLocalDatabaseOpening(database);

    renderEdit(organizationId);

    expect(await screen.findByRole("generic", { busy: true })).toBeInTheDocument();
    expect(screen.queryByLabelText(text.lastName)).not.toBeInTheDocument();

    read.release();

    expect(await screen.findByLabelText(text.lastName)).toHaveValue("Moreau");
    expect(screen.queryByRole("generic", { busy: true })).not.toBeInTheDocument();
  });

  it("explains that the customer does not exist", async () => {
    renderEdit(newOrganizationId());

    expect(
      await screen.findByRole("heading", { name: customersFr.file.notFoundTitle }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: customersFr.file.backToList })).toHaveAttribute(
      "href",
      "/clients",
    );
  });

  it("prefills the form with the customer kept on the device", async () => {
    const organizationId = newOrganizationId();
    await seedLocalDatabase(organizationId, { customers: [moreau] });

    renderEdit(organizationId);

    expect(await screen.findByLabelText(text.lastName)).toHaveValue("Moreau");
    expect(screen.getByLabelText(text.firstName)).toHaveValue("Martine");
    expect(screen.getByLabelText(text.phone)).toHaveValue("06 12 34 56 78");
    expect(screen.getByLabelText(/Email/)).toHaveValue("martine@exemple.fr");
    expect(screen.getByRole("radio", { name: text.kinds.individual })).toBeChecked();
  });

  it("saves the changes on the device, queues them and returns to the file", async () => {
    const organizationId = newOrganizationId();
    const database = await seedLocalDatabase(organizationId, { customers: [moreau] });
    const rendered = renderEdit(organizationId);
    const phone = await screen.findByLabelText(text.phone);
    await rendered.user.clear(phone);
    await rendered.user.type(phone, "01 45 67 89 00");

    await rendered.user.click(screen.getByRole("button", { name: text.saveChanges }));

    expect(await screen.findByText(customersFr.toasts.customerUpdated)).toBeVisible();
    await waitFor(() => {
      expect(rendered.router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}`);
    });
    expect((await database.customers.get(CUSTOMER_ID))?.phone).toBe("01 45 67 89 00");
    expect(await outboxTypes(organizationId)).toEqual(["update_customer"]);
    expect(rendered.api.requestsTo("PATCH /api/customers/customer-1")).toEqual([]);
  });

  it("keeps the customer unchanged when the last name is removed", async () => {
    const organizationId = newOrganizationId();
    const database = await seedLocalDatabase(organizationId, { customers: [moreau] });
    const rendered = renderEdit(organizationId);
    await rendered.user.clear(await screen.findByLabelText(text.lastName));

    await rendered.user.click(screen.getByRole("button", { name: text.saveChanges }));

    expect(await screen.findByText(text.errors.lastName)).toBeVisible();
    expect((await database.customers.get(CUSTOMER_ID))?.lastName).toBe("Moreau");
    expect(await outboxTypes(organizationId)).toEqual([]);
    expect(rendered.router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}/modifier`);
  });

  it("returns to the file without saving when cancelled", async () => {
    const organizationId = newOrganizationId();
    await seedLocalDatabase(organizationId, { customers: [moreau] });
    const rendered = renderEdit(organizationId);
    await rendered.user.type(await screen.findByLabelText(text.firstName), "-Anne");

    await rendered.user.click(screen.getByRole("button", { name: text.cancel }));

    await waitFor(() => {
      expect(rendered.router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}`);
    });
    expect(await outboxTypes(organizationId)).toEqual([]);
  });
});
