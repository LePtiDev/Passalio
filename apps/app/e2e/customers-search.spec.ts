import { expect, test, type Page } from "@playwright/test";
import { calendarDateFromToday, seedSweptCustomer } from "./support/certificates";
import { expectUpToDate, seedCustomer, uniqueName } from "./support/customers";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  onboardFieldOwner,
  openCustomerList,
} from "./support/field-context";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS * 2 });

const searchBox = (page: Page) => page.getByRole("searchbox", { name: "Rechercher un client" });

const customerRows = (page: Page, prefix: string) =>
  page.getByRole("link", { name: new RegExp(prefix) });

const filterButton = (page: Page, name: RegExp) => page.getByRole("button", { name });

const ALL = /^(Tous)\b/;
const NEAR = /^(Échéance proche|Proches)\b/;
const OVERDUE = /^(En retard)\b/;

const site = (city: string, postalCode: string) => ({
  address: "1 rue de la Paix",
  postalCode,
  city,
  buildingType: "house" as const,
});

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("customers are found by name, city or phone, and an empty search offers to create one", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const lefebvre = uniqueName("Lefebvre");
      const garnier = uniqueName("Garnier");
      const roux = uniqueName("Roux");
      await seedCustomer(
        context.request,
        { kind: "individual", lastName: lefebvre, phone: "06 11 11 11 11" },
        site("Vincennes", "94300"),
      );
      await seedCustomer(
        context.request,
        { kind: "individual", lastName: garnier, phone: "06 22 22 22 22" },
        site("Montreuil", "93100"),
      );
      await seedCustomer(
        context.request,
        { kind: "individual", lastName: roux, phone: "07 33 44 55 66" },
        site("Vincennes", "94300"),
      );
      await openCustomerList(page);
      await expectUpToDate(page);
      await expect(page.getByRole("link", { name: new RegExp(lefebvre) })).toBeVisible();

      await searchBox(page).fill(lefebvre.slice(0, 7).toLowerCase());
      await expect(page.getByRole("link", { name: new RegExp(lefebvre) })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(garnier) })).toHaveCount(0);

      await searchBox(page).fill("vincennes");
      await expect(page.getByRole("link", { name: new RegExp(lefebvre) })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(roux) })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(garnier) })).toHaveCount(0);

      await searchBox(page).fill("0733 44");
      await expect(page.getByRole("link", { name: new RegExp(roux) })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(lefebvre) })).toHaveCount(0);

      await searchBox(page).fill("Zzyzx");
      await expect(
        page.getByRole("heading", { name: "Aucun client pour « Zzyzx »" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Créer le client « Zzyzx »" })).toBeVisible();
      await page.getByRole("button", { name: "Effacer la recherche" }).click();
      await expect(searchBox(page)).toHaveValue("");
      await expect(page.getByRole("link", { name: new RegExp(garnier) })).toBeVisible();

      await searchBox(page).fill("Zzyzx");
      await page.getByRole("link", { name: "Créer le client « Zzyzx »" }).click();
      await expect(page.getByRole("heading", { name: "Nouveau client" })).toBeVisible();
      await expect(page.getByLabel("Nom", { exact: true })).toHaveValue("Zzyzx");
      await context.close();
    });

    test("due date filters list the customers whose next visit is near or overdue", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size, { trades: ["Ramonage"] });
      const overdue = uniqueName("Retard");
      const near = uniqueName("Proche");
      const later = uniqueName("Tranquille");
      await seedSweptCustomer(context.request, {
        lastName: overdue,
        city: "Vincennes",
        sweptOn: calendarDateFromToday({ months: -14 }),
      });
      await seedSweptCustomer(context.request, {
        lastName: near,
        city: "Vincennes",
        sweptOn: calendarDateFromToday({ months: -12, days: 10 }),
      });
      await seedSweptCustomer(context.request, {
        lastName: later,
        city: "Vincennes",
        sweptOn: calendarDateFromToday({ months: -2 }),
      });
      await openCustomerList(page);
      await expectUpToDate(page);
      await expect(page.getByRole("link", { name: new RegExp(later) })).toBeVisible();
      await expect(filterButton(page, ALL)).toHaveAttribute("aria-pressed", "true");
      await expect(filterButton(page, ALL)).toContainText("3");
      await expect(filterButton(page, NEAR)).toContainText("1");
      await expect(filterButton(page, OVERDUE)).toContainText("1");

      await filterButton(page, NEAR).click();
      await expect(filterButton(page, NEAR)).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByRole("link", { name: new RegExp(near) })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(overdue) })).toHaveCount(0);
      await expect(page.getByRole("link", { name: new RegExp(later) })).toHaveCount(0);

      await filterButton(page, OVERDUE).click();
      await expect(page.getByRole("link", { name: new RegExp(overdue) })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(near) })).toHaveCount(0);

      await filterButton(page, ALL).click();
      await expect(page.getByRole("link", { name: new RegExp(later) })).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(near) })).toBeVisible();
      await context.close();
    });

    test("a long customer list is split into pages", async ({ browser }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const total = 55;
      const prefix = uniqueName("Page");
      await Array.from({ length: total }, (_, index) => index).reduce(async (previous, index) => {
        await previous;
        await seedCustomer(
          context.request,
          { kind: "individual", lastName: `${prefix} ${String(index).padStart(2, "0")}` },
          site("Vincennes", "94300"),
        );
      }, Promise.resolve());
      await openCustomerList(page);
      await expectUpToDate(page);
      const pagination = page.getByRole("navigation", { name: "Pagination" });
      await expect(pagination).toContainText(new RegExp(`^1–\\d+ sur ${total}`));
      const firstPageSize = await customerRows(page, prefix).count();
      expect(firstPageSize).toBeGreaterThanOrEqual(5);
      expect(firstPageSize).toBeLessThan(total);
      await expect(page.getByRole("link", { name: new RegExp(`${prefix} 00`) })).toBeVisible();
      await expect(pagination.getByRole("button", { name: "Page précédente" })).toBeDisabled();

      await pagination.getByRole("button", { name: "Page suivante" }).click();
      await expect(pagination).toContainText(new RegExp(`^${firstPageSize + 1}–\\d+ sur ${total}`));
      await expect(page.getByRole("link", { name: new RegExp(`${prefix} 00`) })).toHaveCount(0);
      await expect(
        page.getByRole("link", {
          name: new RegExp(`${prefix} ${String(firstPageSize).padStart(2, "0")}`),
        }),
      ).toBeVisible();

      await pagination.getByRole("button", { name: "Page précédente" }).click();
      await expect(page.getByRole("link", { name: new RegExp(`${prefix} 00`) })).toBeVisible();
      await context.close();
    });
  });
}
