import { expect, test } from "@playwright/test";
import { editCustomerField } from "../e2e/support/customer-screens";
import {
  createIndividualCustomer,
  customerNameOf,
  expectOnServer,
  expectUpToDate,
  newIndividualCustomer,
  serverCustomerFile,
  syncIndicator,
  visible,
} from "../e2e/support/customers";
import { addInsert } from "../e2e/support/equipments";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  goOffline,
  goOnline,
  onboardFieldOwner,
} from "../e2e/support/field-context";
import { waitForServiceWorkerControl } from "../e2e/support/pwa";
import { expectPendingCountAbove, pendingCountOf } from "../e2e/support/sync-control";
import { VIEWPORTS } from "../e2e/support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("an edit and a new equipment made without network survive a reload and reach the server when the network is back", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);
      await expectUpToDate(page);
      await waitForServiceWorkerControl(page);

      await goOffline(page);
      await editCustomerField(page, "Email", "recharge@exemple.fr");
      await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
      await addInsert(page);
      const pendingBeforeReload = await expectPendingCountAbove(page, 1);

      await page.reload();
      await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
      await expect(visible(page, "recharge@exemple.fr")).toBeVisible();
      await expect(visible(page, "Insert bois · Invicta")).toBeVisible();
      await expect(syncIndicator(page, /^Hors ligne · \d+ à envoyer$/)).toBeVisible();
      expect(await pendingCountOf(page)).toBe(pendingBeforeReload);
      const beforeSync = await serverCustomerFile(context.request, customerId);
      expect(beforeSync?.customer.email ?? null).toBeNull();
      expect(beforeSync?.equipments).toEqual([]);

      await goOnline(page);
      await expectUpToDate(page);
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored, equipments }) =>
          stored.email === "recharge@exemple.fr" &&
          equipments.some(({ kind, brand }) => kind === "insert" && brand === "Invicta"),
      );
      await context.close();
    });
  });
}
