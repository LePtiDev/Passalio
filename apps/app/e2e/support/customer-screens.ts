import { expect, type Page } from "@playwright/test";
const LARGE_SCREEN_MIN_WIDTH = 1024;

export const isLargeScreen = (page: Page) =>
  (page.viewportSize()?.width ?? 0) >= LARGE_SCREEN_MIN_WIDTH;

export const openCustomerFromList = async (page: Page, name: string) => {
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
};

export const openEditCustomer = async (page: Page) => {
  if (isLargeScreen(page)) {
    await page.getByRole("link", { name: "Modifier", exact: true }).first().click();
  } else {
    await page.getByRole("button", { name: "Plus d'actions" }).click();
    await page.getByRole("menuitem", { name: "Modifier" }).click();
  }
  await expect(page.getByRole("heading", { name: "Modifier le client" })).toBeVisible();
  await expect(page.getByLabel("Téléphone")).toBeVisible();
};

export const editCustomerField = async (page: Page, label: string, value: string) => {
  await openEditCustomer(page);
  await page.getByLabel(label).fill(value);
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByText("Client modifié.")).toBeVisible();
};

export const goToCustomerList = async (page: Page) => {
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .filter({ visible: true })
    .getByRole("link", { name: "Clients" })
    .click();
  await expect(page).toHaveURL(/\/clients$/);
  await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
};

export const openNewSite = async (page: Page) => {
  await page.getByRole("link", { name: "Ajouter un lieu" }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Nouveau lieu" })).toBeVisible();
  await expect(page.getByLabel("Adresse", { exact: true })).toBeVisible();
};

export const archiveFromFile = async (page: Page, name: string) => {
  await page.getByRole("button", { name: "Plus d'actions" }).filter({ visible: true }).click();
  await page.getByRole("menuitem", { name: "Archiver le client" }).click();
  const dialog = page.getByRole("alertdialog", { name: `Archiver ${name} ?` });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Archiver" }).click();
  await expect(page.getByText("Client archivé.")).toBeVisible();
  await expect(page).toHaveURL(/\/clients$/);
};
