import { expect, test } from "@playwright/test";
import { openEditCustomer } from "./support/customer-screens";
import {
  createIndividualCustomer,
  customerNameOf,
  expectOnServer,
  expectUpToDate,
  newIndividualCustomer,
  serverCustomerFile,
} from "./support/customers";
import { FIELD_JOURNEY_TIMEOUT_MS, onboardFieldOwner } from "./support/field-context";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("the customer edit form explains each invalid field and keeps the customer unchanged", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);
      await expectUpToDate(page);

      await openEditCustomer(page);
      await page.getByLabel("Nom", { exact: true }).fill("");
      await page.getByLabel("Téléphone").fill("06 12");
      await page.getByLabel("Email").fill("moreau@");
      await page.getByRole("button", { name: "Enregistrer", exact: true }).click();

      await expect(page.getByText("Indiquez le nom du client.")).toBeVisible();
      await expect(page.getByText("Ce numéro est incomplet.")).toBeVisible();
      await expect(page.getByText("Saisissez une adresse email valide.")).toBeVisible();
      await expect(page.getByLabel("Nom", { exact: true })).toHaveAttribute("aria-invalid", "true");
      await expect(page.getByLabel("Email")).toHaveAccessibleDescription(
        /Saisissez une adresse email valide\./,
      );
      await expect(page.getByText("Client modifié.")).toHaveCount(0);
      await expect(page).toHaveURL(/\/modifier$/);
      await expect(page.getByRole("heading", { name: "Modifier le client" })).toBeVisible();

      const unchanged = await serverCustomerFile(context.request, customerId);
      expect(unchanged?.customer.lastName).toBe(customer.lastName);
      expect(unchanged?.customer.email ?? null).toBeNull();

      await page.getByLabel("Nom", { exact: true }).fill(`${customer.lastName}-Petit`);
      await page.getByLabel("Téléphone").fill("06 12 34 56 78");
      await page.getByLabel("Email").fill("moreau@exemple.fr");
      await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
      await expect(page.getByText("Client modifié.")).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: customerNameOf({ ...customer, lastName: `${customer.lastName}-Petit` }),
        }),
      ).toBeVisible();
      await expectUpToDate(page);
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored }) =>
          stored.lastName === `${customer.lastName}-Petit` && stored.email === "moreau@exemple.fr",
      );
      await context.close();
    });
  });
}
