import { expect, test } from "@playwright/test";
import { goToCustomerList } from "../e2e/support/customer-screens";
import {
  customerIdOf,
  customerNameOf,
  expectOnServer,
  expectUpToDate,
  fillIndividualCustomer,
  newIndividualCustomer,
  PENDING_BANNER,
  PENDING_OFFLINE,
  serverCustomerFile,
  syncIndicator,
  createIndividualCustomer,
} from "../e2e/support/customers";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  goOffline,
  goOnline,
  newCustomerLink,
  onboardFieldOwner,
  openCustomerList,
} from "../e2e/support/field-context";
import { waitForServiceWorkerControl } from "../e2e/support/pwa";
import { VIEWPORTS } from "../e2e/support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("a customer created without network survives a reload and reaches the server when the network is back", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      await openCustomerList(page);
      await expect(page.getByText("Ajoutez votre premier client")).toBeVisible();
      await waitForServiceWorkerControl(page);

      await goOffline(page);
      await newCustomerLink(page).click();
      await expect(page.getByRole("heading", { name: "Nouveau client" })).toBeVisible();
      const customer = newIndividualCustomer();
      await fillIndividualCustomer(page, customer);
      await page.getByRole("button", { name: "Enregistrer le client" }).click();
      await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
      const customerId = customerIdOf(page);

      await page.reload();
      await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
      await expect(syncIndicator(page, PENDING_OFFLINE)).toBeVisible();
      await goToCustomerList(page);
      await expect(page.getByText(PENDING_BANNER)).toBeVisible();
      const row = page.getByRole("link", { name: new RegExp(customerNameOf(customer)) });
      await expect(row).toContainText("À envoyer");
      expect(await serverCustomerFile(context.request, customerId)).toBeNull();

      await goOnline(page);
      await expectUpToDate(page);
      await expect(row).not.toContainText("À envoyer");
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored, sites }) =>
          stored.lastName === customer.lastName &&
          stored.firstName === customer.firstName &&
          sites.some(
            ({ postalCode, city }) => postalCode === customer.postalCode && city === customer.city,
          ),
      );
      await context.close();
    });

    test("the app starts without network with the last session and its local customers", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      await createIndividualCustomer(page, customer);
      await expectUpToDate(page);
      await waitForServiceWorkerControl(page);
      await page.close();

      await context.setOffline(true);
      const restarted = await context.newPage();
      await restarted.goto("/clients");
      await expect(restarted).toHaveURL(/\/clients$/);
      await expect(restarted.getByRole("heading", { name: "Clients" })).toBeVisible();
      await expect(
        restarted.getByRole("link", { name: new RegExp(customerNameOf(customer)) }),
      ).toBeVisible();
      await expect(syncIndicator(restarted, "Hors ligne")).toBeVisible();

      await restarted.getByRole("link", { name: new RegExp(customerNameOf(customer)) }).click();
      await expect(
        restarted.getByRole("heading", { name: customerNameOf(customer) }),
      ).toBeVisible();
      await context.close();
    });
  });
}
