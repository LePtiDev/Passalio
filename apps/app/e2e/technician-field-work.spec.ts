import { expect, test } from "@playwright/test";
import {
  archiveFromFile,
  editCustomerField,
  openCustomerFromList,
} from "./support/customer-screens";
import {
  createIndividualCustomer,
  customerNameOf,
  expectOnServer,
  expectUpToDate,
  newIndividualCustomer,
  serverCustomerFile,
} from "./support/customers";
import { addInsert } from "./support/equipments";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  onboardFieldOwner,
  openCustomerList,
} from "./support/field-context";
import { joinTeamAs } from "./support/team";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS * 2 });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("a technician creates a customer, adds an equipment and edits the customer, and the server keeps it", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const technician = await joinTeamAs(browser, size, page, "Technicien");

      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(technician.page, customer);
      await addInsert(technician.page);
      await editCustomerField(technician.page, "Téléphone", "07 12 12 12 12");
      await expect(
        technician.page.getByRole("heading", { name: customerNameOf(customer) }),
      ).toBeVisible();
      await expectUpToDate(technician.page);
      await technician.page
        .getByRole("button", { name: "Plus d'actions" })
        .filter({ visible: true })
        .click();
      await expect(
        technician.page.getByRole("menuitem", { name: "Ajouter un lieu" }),
      ).toBeVisible();
      await technician.page.keyboard.press("Escape");
      await expect(technician.page.getByRole("button", { name: /Archiver/ })).toHaveCount(0);
      await expect(technician.page.getByRole("menuitem", { name: /Archiver/ })).toHaveCount(0);

      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored, equipments }) =>
          stored.lastName === customer.lastName &&
          stored.phone?.replaceAll(" ", "") === "0712121212" &&
          equipments.some(({ kind, status }) => kind === "insert" && status === "active"),
      );
      await openCustomerList(page);
      await expectUpToDate(page);
      await expect(
        page.getByRole("link", { name: new RegExp(customerNameOf(customer)) }),
      ).toBeVisible({
        timeout: 15_000,
      });
      await technician.context.close();
      await context.close();
    });

    test("an administrator archives a customer from its file", async ({ browser }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);
      await expectUpToDate(page);

      const administrator = await joinTeamAs(browser, size, page, "Administrateur");
      await openCustomerList(administrator.page);
      await openCustomerFromList(administrator.page, customerNameOf(customer));
      await archiveFromFile(administrator.page, customerNameOf(customer));
      await expect(
        administrator.page.getByRole("link", { name: new RegExp(customerNameOf(customer)) }),
      ).toHaveCount(0);
      await expect.poll(() => serverCustomerFile(context.request, customerId)).toBeNull();
      await administrator.context.close();
      await context.close();
    });
  });
}
