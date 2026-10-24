import { expect, test } from "@playwright/test";
import {
  editCustomerField,
  goToCustomerList,
  openCustomerFromList,
} from "./support/customer-screens";
import {
  createIndividualCustomer,
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
} from "./support/customers";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  goOffline,
  goOnline,
  newCustomerLink,
  onboardFieldOwner,
  openCustomerList,
  signInOnSecondDevice,
} from "./support/field-context";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("a customer created without network is shown as pending, then synchronized when the network is back", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      await openCustomerList(page);
      await expect(page.getByText("Ajoutez votre premier client")).toBeVisible();

      await goOffline(page);
      await expect(syncIndicator(page, "Hors ligne")).toBeVisible();
      await expect(page.getByText("Vous êtes hors ligne")).toBeVisible();

      await newCustomerLink(page).click();
      await expect(page.getByRole("heading", { name: "Nouveau client" })).toBeVisible();
      const customer = newIndividualCustomer();
      await fillIndividualCustomer(page, customer);
      await page.getByRole("button", { name: "Enregistrer le client" }).click();
      await expect(
        page.getByText("Client ajouté. Il est enregistré sur ce téléphone."),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
      await expect(syncIndicator(page, PENDING_OFFLINE)).toBeVisible();
      const customerId = customerIdOf(page);

      await goToCustomerList(page);
      const row = page.getByRole("link", { name: new RegExp(customerNameOf(customer)) });
      await expect(row).toContainText("À envoyer");
      await expect(page.getByText(PENDING_BANNER)).toBeVisible();
      expect(await serverCustomerFile(context.request, customerId)).toBeNull();

      await goOnline(page);
      await expectUpToDate(page);
      await expect(page.getByText("Vous êtes hors ligne")).toBeHidden();
      await expect(row).not.toContainText("À envoyer");
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored, sites }) =>
          stored.lastName === customer.lastName && sites.some(({ city }) => city === customer.city),
      );
      await context.close();
    });

    test("when two devices change the same field, the last change sent wins", async ({
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
      await editCustomerField(second.page, "Téléphone", "07 22 22 22 22");
      await editCustomerField(page, "Téléphone", "07 11 11 11 11");
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored }) => stored.phone?.replaceAll(" ", "") === "0711111111",
      );

      await goOnline(second.page);
      await expectUpToDate(second.page);
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored }) => stored.phone?.replaceAll(" ", "") === "0722222222",
      );
      await page.reload();
      await expect(page.getByText("07 22 22 22 22").filter({ visible: true }).first()).toBeVisible({
        timeout: 15_000,
      });
      await context.close();
      await second.context.close();
    });
  });
}
