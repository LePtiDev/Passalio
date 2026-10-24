import { expect, test, type Page } from "@playwright/test";
import {
  expectNoSeriousAccessibilityViolations,
  seriousAccessibilityViolations,
} from "./support/accessibility";
import { editCustomerField } from "./support/customer-screens";
import {
  createIndividualCustomer,
  customerNameOf,
  expectUpToDate,
  newIndividualCustomer,
  visible,
} from "./support/customers";
import { addInsert } from "./support/equipments";
import { FIELD_JOURNEY_TIMEOUT_MS, goOffline, onboardFieldOwner } from "./support/field-context";
import { smallTouchTargets } from "./support/touch-targets";
import { DESKTOP, MOBILE } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

type FileState = {
  readonly name: string;
  readonly open: (page: Page) => Promise<void>;
};

const STATES: readonly FileState[] = [
  {
    name: "the customer file with a removed equipment",
    open: async (page) => {
      const customer = newIndividualCustomer();
      await createIndividualCustomer(page, customer);
      await expectUpToDate(page);
      await addInsert(page);
      await page.getByRole("button", { name: "Actions sur l'appareil" }).click();
      await page.getByRole("menuitem", { name: "Retirer" }).click();
      await page
        .getByRole("alertdialog", { name: "Retirer Insert bois · Invicta ?" })
        .getByRole("button", { name: "Retirer" })
        .click();
      await expect(page.getByText("Appareil retiré. Il reste dans l'historique.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Appareils retirés (1)" })).toBeVisible();
      await expect(visible(page, /^retiré le /)).toBeVisible();
      await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
    },
  },
  {
    name: "the customer file with a change waiting for the network",
    open: async (page) => {
      const customer = newIndividualCustomer();
      await createIndividualCustomer(page, customer);
      await expectUpToDate(page);
      await goOffline(page);
      await editCustomerField(page, "Email", "attente@exemple.fr");
      await expect(page.getByRole("heading", { name: customerNameOf(customer) })).toBeVisible();
      await expect(visible(page, "attente@exemple.fr")).toBeVisible();
      await expect(visible(page, /^Hors ligne · \d+ à envoyer$/)).toBeVisible();
    },
  },
];

for (const state of STATES) {
  test(`${state.name} has no serious accessibility violation and 48 px touch targets on mobile`, async ({
    browser,
  }) => {
    const { context, page } = await onboardFieldOwner(browser, MOBILE);
    await state.open(page);
    const violations = await seriousAccessibilityViolations(page);
    const smallTargets = await smallTouchTargets(page);
    expect({ violations, smallTargets }).toEqual({ violations: [], smallTargets: [] });
    await context.close();
  });

  test(`${state.name} has no serious accessibility violation on desktop`, async ({ browser }) => {
    const { context, page } = await onboardFieldOwner(browser, DESKTOP);
    await state.open(page);
    await expectNoSeriousAccessibilityViolations(page);
    await context.close();
  });
}
