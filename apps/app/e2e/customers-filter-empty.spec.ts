import { expect, test } from "@playwright/test";
import { expectUpToDate, seedCustomer, uniqueName } from "./support/customers";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  onboardFieldOwner,
  openCustomerList,
} from "./support/field-context";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("a due date filter without any customer shows an empty state instead of an empty table", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const lastName = uniqueName("Sansretard");
      await seedCustomer(
        context.request,
        { kind: "individual", lastName },
        {
          address: "1 rue de la Paix",
          postalCode: "94300",
          city: "Vincennes",
          buildingType: "house",
        },
      );
      await openCustomerList(page);
      await expectUpToDate(page);
      await expect(page.getByRole("link", { name: new RegExp(lastName) })).toBeVisible();

      await page.getByRole("button", { name: /^En retard\b/ }).click();
      await expect(page.getByRole("button", { name: /^En retard\b/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.getByRole("link", { name: new RegExp(lastName) })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: /^Aucun client/ })).toBeVisible();
      await context.close();
    });
  });
}
