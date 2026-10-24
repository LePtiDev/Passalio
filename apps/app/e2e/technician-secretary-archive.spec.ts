import { expect, test } from "@playwright/test";
import { archiveFromFile, openCustomerFromList } from "./support/customer-screens";
import {
  createIndividualCustomer,
  customerNameOf,
  expectUpToDate,
  newIndividualCustomer,
  serverCustomerFile,
} from "./support/customers";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  onboardFieldOwner,
  openCustomerList,
} from "./support/field-context";
import { joinTeamAs } from "./support/field-team";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS * 2 });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("the secretary archives a customer, the technician is not offered to", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);
      await expectUpToDate(page);

      const technician = await joinTeamAs(browser, size, page, "Technicien");
      await openCustomerList(technician.page);
      await openCustomerFromList(technician.page, customerNameOf(customer));
      await technician.page
        .getByRole("button", { name: "Plus d'actions" })
        .filter({ visible: true })
        .click();
      await expect(
        technician.page.getByRole("menuitem", { name: "Ajouter un lieu" }),
      ).toBeVisible();
      await expect(
        technician.page.getByRole("menuitem", { name: "Archiver le client" }),
      ).toHaveCount(0);
      await technician.page.keyboard.press("Escape");

      const secretary = await joinTeamAs(browser, size, page, "Secrétariat");
      await openCustomerList(secretary.page);
      await openCustomerFromList(secretary.page, customerNameOf(customer));
      await archiveFromFile(secretary.page, customerNameOf(customer));
      await expect(
        secretary.page.getByRole("link", { name: new RegExp(customerNameOf(customer)) }),
      ).toHaveCount(0);
      await expect.poll(() => serverCustomerFile(context.request, customerId)).toBeNull();

      await technician.page.reload();
      await expect(
        technician.page.getByText("Ce client n'existe pas ou a été archivé"),
      ).toBeVisible({
        timeout: 15_000,
      });
      await technician.context.close();
      await secretary.context.close();
      await context.close();
    });
  });
}
