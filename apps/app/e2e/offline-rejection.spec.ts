import { expect, test } from "@playwright/test";
import {
  archiveFromFile,
  editCustomerField,
  openCustomerFromList,
} from "./support/customer-screens";
import {
  createIndividualCustomer,
  customerNameOf,
  expectUpToDate,
  newIndividualCustomer,
  PENDING_OFFLINE,
  serverCustomerFile,
  syncIndicator,
} from "./support/customers";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  goOffline,
  goOnline,
  onboardFieldOwner,
  openCustomerList,
  signInOnSecondDevice,
} from "./support/field-context";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("a change refused by the server is shown to the user", async ({ browser }) => {
      const { context, page, owner } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);
      await expectUpToDate(page);
      const second = await signInOnSecondDevice(browser, size, owner);
      await openCustomerList(second.page);
      await openCustomerFromList(second.page, customerNameOf(customer));

      await goOffline(second.page);
      await editCustomerField(second.page, "Téléphone", "07 11 22 33 44");
      await expect(syncIndicator(second.page, PENDING_OFFLINE)).toBeVisible();

      await archiveFromFile(page, customerNameOf(customer));
      await expect.poll(() => serverCustomerFile(context.request, customerId)).toBeNull();

      await goOnline(second.page);
      await expect(second.page.getByText("1 modification refusée par le serveur.")).toBeVisible({
        timeout: 15_000,
      });
      await context.close();
      await second.context.close();
    });
  });
}
