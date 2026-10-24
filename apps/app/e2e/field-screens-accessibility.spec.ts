import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  expectNoSeriousAccessibilityViolations,
  seriousAccessibilityViolations,
} from "./support/accessibility";
import { openEditCustomer, openNewSite } from "./support/customer-screens";
import {
  chooseOption,
  createIndividualCustomer,
  expectUpToDate,
  newIndividualCustomer,
  openNewCustomerForm,
} from "./support/customers";
import { addInsert, openNewEquipment } from "./support/equipments";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  goOffline,
  onboardFieldOwner,
  openCustomerList,
} from "./support/field-context";
import { smallTouchTargets } from "./support/touch-targets";
import { DESKTOP, MOBILE } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS * 2 });

type FieldScreen = {
  readonly name: string;
  readonly open: (page: Page, context: BrowserContext) => Promise<void>;
};

const withCustomer = async (page: Page) => {
  await createIndividualCustomer(page, newIndividualCustomer());
  await expectUpToDate(page);
};

const SCREENS: readonly FieldScreen[] = [
  {
    name: "the empty customer list",
    open: async (page) => {
      await openCustomerList(page);
      await expect(page.getByText("Ajoutez votre premier client")).toBeVisible();
    },
  },
  {
    name: "the customer list with a customer",
    open: async (page) => {
      await withCustomer(page);
      await openCustomerList(page);
      await expect(page.getByRole("searchbox", { name: "Rechercher un client" })).toBeVisible();
    },
  },
  {
    name: "the customer list without network",
    open: async (page) => {
      await withCustomer(page);
      await openCustomerList(page);
      await goOffline(page);
      await expect(page.getByText("Vous êtes hors ligne")).toBeVisible();
    },
  },
  {
    name: "the customer search without result",
    open: async (page) => {
      await withCustomer(page);
      await openCustomerList(page);
      await page.getByRole("searchbox", { name: "Rechercher un client" }).fill("Zzyzx");
      await expect(
        page.getByRole("heading", { name: "Aucun client pour « Zzyzx »" }),
      ).toBeVisible();
    },
  },
  {
    name: "the new customer form with its errors",
    open: async (page) => {
      await openNewCustomerForm(page);
      await page.getByRole("button", { name: "Enregistrer le client" }).click();
      await expect(page.getByText("Indiquez le nom du client.")).toBeVisible();
    },
  },
  {
    name: "the customer file with an equipment",
    open: async (page) => {
      await withCustomer(page);
      await addInsert(page);
    },
  },
  {
    name: "the customer edit form",
    open: async (page) => {
      await withCustomer(page);
      await openEditCustomer(page);
    },
  },
  {
    name: "the new site form",
    open: async (page) => {
      await withCustomer(page);
      await openNewSite(page);
    },
  },
  {
    name: "the new equipment form for a stove",
    open: async (page) => {
      await withCustomer(page);
      await openNewEquipment(page);
      await chooseOption(page, "Ramonage et entretien", "Poêle à bûches");
    },
  },
  {
    name: "the new equipment form for a heat pump",
    open: async (page) => {
      await withCustomer(page);
      await openNewEquipment(page);
      await chooseOption(page, "Pompe à chaleur et climatisation", "PAC air/air");
    },
  },
];

for (const screen of SCREENS) {
  test(`${screen.name} has no serious accessibility violation and 48 px touch targets on mobile`, async ({
    browser,
  }) => {
    const { context, page } = await onboardFieldOwner(browser, MOBILE);
    await screen.open(page, context);
    const violations = await seriousAccessibilityViolations(page);
    const smallTargets = await smallTouchTargets(page);
    expect({ violations, smallTargets }).toEqual({ violations: [], smallTargets: [] });
    await context.close();
  });

  test(`${screen.name} has no serious accessibility violation on desktop`, async ({ browser }) => {
    const { context, page } = await onboardFieldOwner(browser, DESKTOP);
    await screen.open(page, context);
    await expectNoSeriousAccessibilityViolations(page);
    await context.close();
  });
}
