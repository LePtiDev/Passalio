import { expect, test } from "@playwright/test";
import { goToCustomerList } from "./support/customer-screens";
import {
  BAN_ADDRESS,
  chooseOption,
  customerIdOf,
  expectOnServer,
  expectUpToDate,
  fillManualAddress,
  openNewCustomerForm,
  uniqueName,
} from "./support/customers";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  onboardFieldOwner,
  openCustomerList,
} from "./support/field-context";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("the empty list leads to a first individual customer with a suggested address", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      await openCustomerList(page);
      await expect(
        page.getByRole("heading", { name: "Ajoutez votre premier client" }),
      ).toBeVisible();
      await expect(page.getByRole("searchbox", { name: "Rechercher un client" })).toHaveCount(0);

      await page
        .getByRole("link", { name: "Nouveau client" })
        .filter({ visible: true })
        .last()
        .click();
      await expect(page).toHaveURL(/\/clients\/nouveau/);
      await expect(page.getByRole("heading", { name: "Nouveau client" })).toBeVisible();

      const lastName = uniqueName("Lefebvre");
      await chooseOption(page, "Civilité", "Madame");
      await page.getByLabel("Prénom").fill("Martine");
      await page.getByLabel("Nom", { exact: true }).fill(lastName);
      await page.getByLabel("Téléphone").fill("06 12 34 56 78");
      await page.getByLabel("Email").fill("martine.lefebvre@exemple.fr");
      await page.getByLabel("Adresse", { exact: true }).fill("12 rue des Ram");
      await page.getByRole("button", { name: new RegExp(BAN_ADDRESS.address) }).click();
      await expect(page.getByLabel("Code postal")).toHaveValue(BAN_ADDRESS.postalCode);
      await expect(page.getByLabel("Ville")).toHaveValue(BAN_ADDRESS.city);
      await page.getByRole("button", { name: "Enregistrer le client" }).click();

      await expect(
        page.getByText("Client ajouté. Il est enregistré sur ce téléphone."),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: `Martine ${lastName}` })).toBeVisible();
      await expect(
        page.getByText("Cliente depuis aujourd'hui").filter({ visible: true }).first(),
      ).toBeVisible();
      await expect(page.getByText("Aucun appareil sur ce lieu")).toBeVisible();
      const customerId = customerIdOf(page);
      await expectUpToDate(page);

      await goToCustomerList(page);
      const row = page.getByRole("link", { name: new RegExp(`Martine ${lastName}`) });
      await expect(row).toBeVisible();
      await expect(row).toContainText(BAN_ADDRESS.city);
      await expectOnServer(
        context.request,
        customerId,
        ({ customer, sites }) =>
          customer.kind === "individual" &&
          customer.lastName === lastName &&
          customer.email === "martine.lefebvre@exemple.fr" &&
          sites.some(
            ({ address, postalCode, city }) =>
              address === BAN_ADDRESS.address &&
              postalCode === BAN_ADDRESS.postalCode &&
              city === BAN_ADDRESS.city,
          ),
      );
      await context.close();
    });

    test("a company customer is created with its company name and on-site contact", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      await openNewCustomerForm(page);
      await chooseOption(page, "Le client", "Professionnel");
      await expect(page.getByLabel("Prénom")).toHaveCount(0);
      const companyName = uniqueName("Boulangerie ");
      await page.getByLabel("Raison sociale").fill(companyName);
      await page.getByLabel("Contact sur place").fill("Durand");
      await page.getByLabel("Téléphone").fill("01 23 45 67 89");
      await fillManualAddress(page, {
        address: "3 place du Marché",
        postalCode: "94300",
        city: "Vincennes",
      });
      await chooseOption(page, "Type de logement", "Local pro");
      await page.getByRole("button", { name: "Enregistrer le client" }).click();

      await expect(page.getByRole("heading", { name: companyName })).toBeVisible();
      await expect(page.getByText("Professionnel").filter({ visible: true }).first()).toBeVisible();
      await expect(page.getByRole("heading", { name: "Local pro" })).toBeVisible();
      const customerId = customerIdOf(page);

      await goToCustomerList(page);
      await expect(page.getByRole("link", { name: new RegExp(companyName) })).toContainText(
        viewportName === "desktop" ? "Contact : Durand · 01 23 45 67 89" : "Vincennes",
      );
      await expectOnServer(
        context.request,
        customerId,
        ({ customer, sites }) =>
          customer.kind === "company" &&
          customer.companyName === companyName &&
          customer.lastName === "Durand" &&
          sites.some(({ city }) => city === "Vincennes"),
      );
      await context.close();
    });

    test("the new customer form explains each invalid field and keeps the customer unsaved", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      await openNewCustomerForm(page);

      await page.getByRole("button", { name: "Enregistrer le client" }).click();
      await expect(page.getByText("Indiquez le nom du client.")).toBeVisible();
      await expect(page.getByText("Indiquez l'adresse.")).toBeVisible();
      await expect(page.getByText("Le code postal compte 5 chiffres.")).toBeVisible();
      await expect(page.getByText("Indiquez la ville.")).toBeVisible();
      await expect(page.getByLabel("Nom", { exact: true })).toHaveAttribute("aria-invalid", "true");
      await expect(page.getByLabel("Nom", { exact: true })).toHaveAccessibleDescription(
        "Indiquez le nom du client.",
      );
      await expect(page).toHaveURL(/\/clients\/nouveau/);

      await page.getByLabel("Nom", { exact: true }).fill("Girard");
      await page.getByLabel("Téléphone").fill("06 12");
      await page.getByLabel("Email").fill("girard@");
      await page.getByLabel("Adresse", { exact: true }).fill("8 rue Victor Hugo");
      await page.getByLabel("Code postal").fill("941");
      await page.getByLabel("Ville").fill("Fontenay-sous-Bois");
      await page.getByRole("button", { name: "Enregistrer le client" }).click();
      await expect(page.getByText("Ce numéro est incomplet.")).toBeVisible();
      await expect(page.getByText("Saisissez une adresse email valide.")).toBeVisible();
      await expect(page.getByText("Le code postal compte 5 chiffres.")).toBeVisible();
      await expect(page.getByText("Indiquez le nom du client.")).toBeHidden();
      await expect(page).toHaveURL(/\/clients\/nouveau/);

      await chooseOption(page, "Le client", "Professionnel");
      await page.getByRole("button", { name: "Enregistrer le client" }).click();
      await expect(page.getByText("Indiquez la raison sociale.")).toBeVisible();

      await chooseOption(page, "Le client", "Particulier");
      await page.getByLabel("Téléphone").fill("06 12 34 56 78");
      await page.getByLabel("Email").fill("girard@exemple.fr");
      await page.getByLabel("Code postal").fill("94120");
      await page.getByRole("button", { name: "Enregistrer le client" }).click();
      await expect(page.getByRole("heading", { name: "Girard" })).toBeVisible();
      await expect(page.getByText("Ce numéro est incomplet.")).toBeHidden();
      await context.close();
    });
  });
}
