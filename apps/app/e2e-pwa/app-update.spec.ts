import { expect, test } from "@playwright/test";
import {
  customerIdOf,
  customerNameOf,
  expectOnServer,
  expectUpToDate,
  fillIndividualCustomer,
  newIndividualCustomer,
  PENDING_OFFLINE,
  serverCustomerFile,
  syncIndicator,
} from "../e2e/support/customers";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  goOffline,
  goOnline,
  newCustomerLink,
  onboardFieldOwner,
  openCustomerList,
} from "../e2e/support/field-context";
import {
  buildIdOf,
  cutSyncConnection,
  deployNewVersion,
  restoreSyncConnection,
  returnToTab,
  waitForServiceWorkerControl,
} from "../e2e/support/pwa";
import { VIEWPORTS } from "../e2e/support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS * 3 });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("a new version reloads the app without losing the changes made offline", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      await openCustomerList(page);
      await waitForServiceWorkerControl(page);
      const firstVersion = await buildIdOf(page).getAttribute("content");

      await goOffline(page);
      await newCustomerLink(page).click();
      await expect(page.getByRole("heading", { name: "Nouveau client" })).toBeVisible();
      const customer = newIndividualCustomer();
      await fillIndividualCustomer(page, customer);
      await page.getByRole("button", { name: "Enregistrer le client" }).click();
      await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
      await expect(syncIndicator(page, PENDING_OFFLINE)).toBeVisible();
      const customerId = customerIdOf(page);

      const nextVersion = `${viewportName}-${crypto.randomUUID()}`;
      await deployNewVersion(nextVersion);
      expect(nextVersion).not.toBe(firstVersion);
      await cutSyncConnection(context);
      await goOnline(page);
      await returnToTab(page);

      await expect(buildIdOf(page)).toHaveAttribute("content", nextVersion, { timeout: 30_000 });
      await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
      expect(await serverCustomerFile(context.request, customerId)).toBeNull();

      await expect(syncIndicator(page, PENDING_OFFLINE)).toBeVisible();

      await restoreSyncConnection(context);
      await goOffline(page);
      await goOnline(page);
      await expectUpToDate(page);
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored }) => stored.lastName === customer.lastName,
      );
      await context.close();
    });
  });
}
