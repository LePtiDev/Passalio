import { expect, test, type Page } from "@playwright/test";
import {
  expectNoSeriousAccessibilityViolations,
  seriousAccessibilityViolations,
} from "./support/accessibility";
import {
  chooseOption,
  createIndividualCustomer,
  customerNameOf,
  expectUpToDate,
  newIndividualCustomer,
} from "./support/customers";
import { addInsert, openNewEquipment, photoInput, PNG_PHOTO } from "./support/equipments";
import { FIELD_JOURNEY_TIMEOUT_MS, onboardFieldOwner } from "./support/field-context";
import { smallTouchTargets } from "./support/touch-targets";
import { DESKTOP, MOBILE } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS * 2 });

type FieldState = {
  readonly name: string;
  readonly isPhoneOnly?: boolean;
  readonly scope?: string;
  readonly open: (page: Page) => Promise<void>;
};

const withCustomer = async (page: Page) => {
  const customer = newIndividualCustomer();
  await createIndividualCustomer(page, customer);
  await expectUpToDate(page);
  return customer;
};

const openRemoval = async (page: Page) => {
  await addInsert(page);
  await page.getByRole("button", { name: "Actions sur l'appareil" }).click();
  await page.getByRole("menuitem", { name: "Retirer" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Retirer Insert bois · Invicta ?" });
  await expect(dialog).toBeVisible();
  return dialog;
};

const STATES: readonly FieldState[] = [
  {
    name: "the page of a customer that does not exist",
    open: async (page) => {
      await page.goto(`/clients/${crypto.randomUUID()}`);
      await expect(
        page.getByRole("heading", { name: "Ce client n'existe pas ou a été archivé" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Retour aux clients" })).toBeVisible();
    },
  },
  {
    name: "the open customer actions menu",
    scope: "[role='menu']",
    open: async (page) => {
      await withCustomer(page);
      await page.getByRole("button", { name: "Plus d'actions" }).filter({ visible: true }).click();
      await expect(page.getByRole("menuitem", { name: "Archiver le client" })).toBeVisible();
    },
  },
  {
    name: "the archive confirmation",
    scope: "[role='alertdialog']",
    open: async (page) => {
      const customer = await withCustomer(page);
      await page.getByRole("button", { name: "Plus d'actions" }).filter({ visible: true }).click();
      await page.getByRole("menuitem", { name: "Archiver le client" }).click();
      await expect(
        page.getByRole("alertdialog", { name: `Archiver ${customerNameOf(customer)} ?` }),
      ).toBeVisible();
    },
  },
  {
    name: "the equipment removal confirmation",
    scope: "[role='alertdialog']",
    open: async (page) => {
      await withCustomer(page);
      await openRemoval(page);
    },
  },
  {
    name: "the new equipment form with a photo",
    isPhoneOnly: true,
    open: async (page) => {
      await withCustomer(page);
      await openNewEquipment(page);
      await chooseOption(page, "Ramonage et entretien", "Poêle à granulés");
      await photoInput(page, "Appareil").setInputFiles(PNG_PHOTO);
      await expect(page.getByRole("img", { name: "Appareil" })).toBeVisible();
    },
  },
];

const scopeOf = ({ scope }: FieldState) => (scope === undefined ? {} : { include: scope });
for (const state of STATES) {
  test(`${state.name} has no serious accessibility violation and 48 px touch targets on mobile`, async ({
    browser,
  }) => {
    const { context, page } = await onboardFieldOwner(browser, MOBILE);
    await state.open(page);
    const violations = await seriousAccessibilityViolations(page, scopeOf(state));
    const smallTargets = await smallTouchTargets(page);
    expect({ violations, smallTargets }).toEqual({ violations: [], smallTargets: [] });
    await context.close();
  });
}

for (const state of STATES.filter(({ isPhoneOnly }) => isPhoneOnly !== true)) {
  test(`${state.name} has no serious accessibility violation on desktop`, async ({ browser }) => {
    const { context, page } = await onboardFieldOwner(browser, DESKTOP);
    await state.open(page);
    await expectNoSeriousAccessibilityViolations(page, scopeOf(state));
    await context.close();
  });
}
