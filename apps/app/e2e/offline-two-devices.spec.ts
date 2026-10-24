import { expect, test } from "@playwright/test";
import { editCustomerField, openCustomerFromList } from "./support/customer-screens";
import {
  createIndividualCustomer,
  customerNameOf,
  expectOnServer,
  expectUpToDate,
  newIndividualCustomer,
  serverCustomerFile,
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
    test("two devices changing different fields of the same customer both keep their change", async ({
      browser,
    }) => {
      const { context, page, owner } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);
      await expectUpToDate(page);
      const second = await signInOnSecondDevice(browser, size, owner);
      await openCustomerList(second.page);
      await openCustomerFromList(second.page, customerNameOf(customer));

      await goOffline(second.page);
      await editCustomerField(second.page, "Email", "martine@exemple.fr");
      await editCustomerField(page, "Téléphone", "07 11 22 33 44");
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored }) => stored.phone?.replaceAll(" ", "") === "0711223344",
      );

      await goOnline(second.page);
      await expectUpToDate(second.page);
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored }) => stored.email === "martine@exemple.fr",
      );
      const file = await serverCustomerFile(context.request, customerId);
      expect(file?.customer.phone?.replaceAll(" ", "")).toBe("0711223344");
      await context.close();
      await second.context.close();
    });
  });
}
