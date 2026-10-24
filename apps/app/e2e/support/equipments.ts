import { expect, type Page } from "@playwright/test";
import { chooseOption } from "./customers";

export const openNewEquipment = async (page: Page) => {
  await page
    .getByRole("link", { name: "Ajouter un appareil" })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "Nouvel appareil" })).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Ramonage et entretien" })).toBeVisible();
};

export const chooseFlueType = async (page: Page, flueType: string) => {
  await page.getByRole("combobox", { name: /Type de conduit/ }).click();
  await page.getByRole("option", { name: flueType }).click();
};

export const saveEquipment = async (page: Page) => {
  await page.getByRole("button", { name: "Ajouter l'appareil" }).click();
  await expect(page.getByText("Appareil ajouté.").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lieux et appareils" })).toBeVisible();
};

export const addInsert = async (page: Page) => {
  await openNewEquipment(page);
  await chooseOption(page, "Ramonage et entretien", "Insert");
  await page.getByLabel("Marque").fill("Invicta");
  await saveEquipment(page);
};

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

export const PNG_PHOTO = { name: "appareil.png", mimeType: "image/png", buffer: ONE_PIXEL_PNG };

export const PDF_FILE = {
  name: "facture.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n%%EOF\n"),
};

export const OVERSIZED_PHOTO = {
  name: "trop-grande.jpg",
  mimeType: "image/jpeg",
  buffer: Buffer.alloc(6 * 1024 * 1024, 0xff),
};

export const photoInput = (page: Page, tile: "Appareil" | "Plaque signalétique") =>
  page.getByLabel(tile, { exact: true });
