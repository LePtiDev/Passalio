import { expect, test } from "@playwright/test";
import { openEditCustomer, openNewSite } from "./support/customer-screens";
import {
  chooseOption,
  createIndividualCustomer,
  customerNameOf,
  expectOnServer,
  expectUpToDate,
  fillManualAddress,
  newIndividualCustomer,
  visible,
} from "./support/customers";
import { FIELD_JOURNEY_TIMEOUT_MS, onboardFieldOwner } from "./support/field-context";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("a customer's contact details are changed from the customer file", async ({ browser }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);
      await expect(visible(page, "Ajoutez un email pour les relances")).toBeVisible();

      await openEditCustomer(page);
      await expect(page.getByLabel("Nom", { exact: true })).toHaveValue(customer.lastName);
      await page.getByLabel("Prénom").fill("Hélène");
      await page.getByLabel("Téléphone").fill("07 98 76 54 32");
      await page.getByLabel("Email").fill("helene@exemple.fr");
      await page.getByLabel("Notes").fill("Préfère le matin");
      await page.getByRole("button", { name: "Enregistrer", exact: true }).click();

      await expect(page.getByText("Client modifié.")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: `Hélène ${customer.lastName}` }),
      ).toBeVisible();
      await expect(visible(page, "07 98 76 54 32")).toBeVisible();
      await expect(visible(page, "helene@exemple.fr")).toBeVisible();
      await expect(visible(page, "Préfère le matin")).toBeVisible();
      await expect(visible(page, "Par email, un mois avant l'échéance")).toBeVisible();
      await expectUpToDate(page);
      await expectOnServer(
        context.request,
        customerId,
        ({ customer: stored }) =>
          stored.firstName === "Hélène" &&
          stored.email === "helene@exemple.fr" &&
          stored.phone?.replaceAll(" ", "") === "0798765432",
      );
      await context.close();
    });

    test("a second site is added to a customer with its occupant", async ({ browser }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const customerId = await createIndividualCustomer(page, customer);

      await openNewSite(page);
      await expect(
        page.getByText(customerNameOf(customer)).filter({ visible: true }).first(),
      ).toBeVisible();
      await page.getByRole("button", { name: "Ajouter le lieu" }).click();
      await expect(page.getByText("Indiquez l'adresse.")).toBeVisible();

      await page.getByLabel("Nom du lieu").fill("Appartement loué");
      await fillManualAddress(page, {
        address: "4 avenue Foch",
        postalCode: "94160",
        city: "Saint-Mandé",
      });
      await chooseOption(page, "Type de logement", "Appartement");
      await page.getByLabel(/^Occupant/).fill("Paul Martin");
      await page.getByLabel("Téléphone de l'occupant").fill("06 55 44 33 22");
      await page.getByLabel("Accès").fill("Digicode 1234B");
      await page.getByRole("button", { name: "Ajouter le lieu" }).click();

      await expect(page.getByText("Lieu ajouté.")).toBeVisible();
      await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Appartement loué" })).toBeVisible();
      await expect(page.getByText("4 avenue Foch, 94160 Saint-Mandé")).toBeVisible();
      await expect(page.getByText("Occupant : Paul Martin · 06 55 44 33 22")).toBeVisible();
      await expect(page.getByText("Digicode 1234B")).toBeVisible();
      await expectUpToDate(page);
      await expectOnServer(
        context.request,
        customerId,
        ({ sites }) =>
          sites.length === 2 &&
          sites.some(({ label, city }) => label === "Appartement loué" && city === "Saint-Mandé"),
      );
      await context.close();
    });
  });
}
