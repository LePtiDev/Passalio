import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { serverCustomerRecord } from "@/lib/sync/sync-test-records";
import { installFakeApi } from "@/test-support/fake-api";
import { newOrganizationId, outboxTypes, seedLocalDatabase } from "@/test-support/local-seeds";
import { goOffline } from "@/test-support/network";
import { renderScreen } from "@/test-support/render-screen";
import { pulledChangesReply, SYNC_PULL_ROUTE } from "@/test-support/sync-replies";
import { dismissAllToasts } from "@/test-support/toasts";
import { customersFr } from "../../fr";
import { EditCustomerScreen } from "./edit-customer-screen";

const text = customersFr.form;

const CUSTOMER_ID = "customer-1";

const moreau = { ...serverCustomerRecord(CUSTOMER_ID, "Moreau"), phone: "06 12 34 56 78" };

const renderEdit = (organizationId: string) =>
  renderScreen(<EditCustomerScreen customerId={CUSTOMER_ID} />, {
    path: `/clients/${CUSTOMER_ID}/modifier`,
    organizationId,
  });

type Rendered = ReturnType<typeof renderEdit>;

const changePhone = async ({ user }: Rendered, phone: string) => {
  const field = await screen.findByLabelText(text.phone);
  await user.clear(field);
  await user.type(field, phone);
  await user.click(screen.getByRole("button", { name: text.saveChanges }));
};

describe("EditCustomerScreen on the field", () => {
  afterEach(() => {
    dismissAllToasts();
    vi.restoreAllMocks();
  });

  it("saves the changes offline without calling the network", async () => {
    const organizationId = newOrganizationId();
    const database = await seedLocalDatabase(organizationId, { customers: [moreau] });
    goOffline();
    const api = installFakeApi();
    const rendered = renderEdit(organizationId);

    await changePhone(rendered, "01 45 67 89 00");

    expect(await screen.findByText(customersFr.toasts.customerUpdated)).toBeVisible();
    await waitFor(() => {
      expect(rendered.router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}`);
    });
    expect((await database.customers.get(CUSTOMER_ID))?.phone).toBe("01 45 67 89 00");
    expect(await outboxTypes(organizationId)).toEqual(["update_customer"]);
    expect(api.requests).toEqual([]);
  });

  it("tells the user the change was not saved and leaves the customer as it was", async () => {
    const organizationId = newOrganizationId();
    const database = await seedLocalDatabase(organizationId, { customers: [moreau] });
    vi.spyOn(database.outbox, "add").mockRejectedValue(new Error("QuotaExceededError"));
    installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });
    const rendered = renderEdit(organizationId);

    await changePhone(rendered, "01 45 67 89 00");

    expect(await screen.findByText(text.errors.saveFailed)).toBeVisible();
    expect(screen.queryByText(customersFr.toasts.customerUpdated)).not.toBeInTheDocument();
    expect(rendered.router.state.location.pathname).toBe(`/clients/${CUSTOMER_ID}/modifier`);
    expect((await database.customers.get(CUSTOMER_ID))?.phone).toBe("06 12 34 56 78");
    expect(await outboxTypes(organizationId)).toEqual([]);
  });

  it("does not open a customer kept on the device for another company", async () => {
    await seedLocalDatabase(newOrganizationId(), { customers: [moreau] });
    installFakeApi({ [SYNC_PULL_ROUTE]: pulledChangesReply() });

    renderEdit(newOrganizationId());

    expect(
      await screen.findByRole("heading", { name: customersFr.file.notFoundTitle }),
    ).toBeVisible();
    expect(screen.queryByLabelText(text.lastName)).not.toBeInTheDocument();
  });
});
