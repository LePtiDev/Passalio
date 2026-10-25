import { expect, type APIRequestContext, type Page } from "@playwright/test";
import * as z from "zod";

const PARIS_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const parisToday = () => PARIS_DAY.format(new Date());

const required = (label: string) =>
  new RegExp(`^${label.replaceAll(/[()]/g, String.raw`\$&`)}\\*?$`);

export const planVisitToday = async (
  page: Page,
  { customerName, lastName }: { readonly customerName: string; readonly lastName: string },
  time: string,
) => {
  const day = parisToday();
  await page.goto(`/planning/nouveau?jour=${day}`);
  await page.getByLabel("Client").fill(lastName);
  await page.getByRole("button", { name: new RegExp(customerName) }).click();
  await page.getByLabel("Heure").fill(time);
  await page.getByRole("button", { name: "Ajouter au planning" }).last().click();
  await expect(page).toHaveURL(new RegExp(`/planning\\?jour=${day}`));
  await page.getByRole("link", { name: new RegExp(`${customerName}, ${time}`) }).click();
  await expect(page).toHaveURL(/\/passages\/[0-9a-f-]{36}$|[?&]passage=[0-9a-f-]{36}/);
  const panelVisit = /[?&]passage=([0-9a-f-]{36})/.exec(page.url())?.[1];
  if (panelVisit !== undefined) {
    await page.goto(`/passages/${panelVisit}`);
  }
  await expect(page.getByRole("link", { name: "Remplir le certificat" }).first()).toBeAttached();
};

export const drawSignature = async (page: Page, padName: RegExp) => {
  const pad = page.getByLabel(padName);
  await pad.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const box = await pad.boundingBox();
  if (box === null) {
    throw new Error("The signature pad is not visible");
  }
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 20, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, y - 20, { steps: 5 });
  await page.mouse.move(box.x + 100, y + 15, { steps: 5 });
  await page.mouse.move(box.x + 160, y - 10, { steps: 5 });
  await page.mouse.up();
};

export const fillLegalMentions = async (page: Page) => {
  await page.getByRole("combobox", { name: required("Forme juridique") }).click();
  await page.getByRole("option", { name: "SARL", exact: true }).click();
  await page.getByLabel(required("Capital social (€)")).fill("5 000");
  await page.getByRole("combobox", { name: required("Immatriculation") }).click();
  await page.getByRole("option", { name: "RCS (registre du commerce)" }).click();
  await page.getByLabel(required("Ville du greffe")).fill("Créteil");
  await page.getByLabel(required("Adresse du siège")).fill("4 rue des Écoles, 94100 Saint-Maur");
};

const pulledDocuments = z.object({
  changes: z.object({
    documents: z.array(
      z.object({ equipmentId: z.string(), number: z.number(), deletedAt: z.string().nullable() }),
    ),
  }),
});

export const serverDocumentCount = async (request: APIRequestContext) => {
  const response = await request.get("/api/sync/pull");
  expect(response.status()).toBe(200);
  const { changes } = pulledDocuments.parse(await response.json());
  return changes.documents.filter(({ deletedAt }) => deletedAt === null).length;
};
