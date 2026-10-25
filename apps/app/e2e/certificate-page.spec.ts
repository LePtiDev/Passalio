import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { API_URL } from "../playwright.config";
import { drawSignature, fillLegalMentions, planVisitToday } from "./support/certificate-signing";
import {
  createIndividualCustomer,
  customerNameOf,
  expectUpToDate,
  newIndividualCustomer,
} from "./support/customers";
import { addInsert } from "./support/equipments";
import { FIELD_JOURNEY_TIMEOUT_MS, onboardFieldOwner } from "./support/field-context";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS * 2 });

const archiveSignedPdfs = async (request: APIRequestContext) => {
  const response = await request.get(`${API_URL}/__scheduled?cron=*/5+*+*+*+*`);
  expect(response.ok()).toBe(true);
};

const signCertificate = async (page: Page) => {
  await page
    .getByRole("link", { name: "Remplir le certificat" })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await drawSignature(page, /^Signature du technicien/);
  await drawSignature(page, /^Signature du client/);
  await page.getByRole("button", { name: "Signer le certificat" }).click();
  await expect(page.getByRole("heading", { name: "Certificat signé" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Enregistré sur le serveur")).toBeVisible({ timeout: 20_000 });
};

for (const { name: viewportName, size } of VIEWPORTS) {
  test(`on ${viewportName}, the certificate opens from the customer history and its archived PDF is verified`, async ({
    browser,
  }) => {
    const { context, page } = await onboardFieldOwner(browser, size);
    await page.goto("/reglages/entreprise");
    await fillLegalMentions(page);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Réglages enregistrés.")).toBeVisible();
    const customer = newIndividualCustomer();
    const name = customerNameOf(customer);
    const customerId = await createIndividualCustomer(page, customer);
    await addInsert(page);
    await expectUpToDate(page);
    await planVisitToday(page, { customerName: name, lastName: customer.lastName }, "09:00");
    await signCertificate(page);

    await archiveSignedPdfs(context.request);
    await page.goto(`/clients/${customerId}`);
    const history = page
      .locator("section")
      .filter({ hasText: "Historique" })
      .filter({ visible: true });
    await expect(history.getByText("1 certificat")).toBeVisible();
    await history.getByRole("link", { name: /^Insert bois · / }).click();

    await expect(page).toHaveURL(/\/certificats\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("img", { name: "Page 1" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/^[0-9a-f]{4} [0-9a-f]{4} · intégrité vérifiée$/)).toBeVisible({
      timeout: 30_000,
    });
    const download = page.waitForEvent("download");
    if (viewportName === "desktop") {
      await page.getByRole("link", { name: "Télécharger" }).click();
    } else {
      await page.getByRole("button", { name: "Autres actions" }).click();
      await page.getByRole("menuitem", { name: "Télécharger" }).click();
    }
    expect((await download).suggestedFilename()).toMatch(/^certificat-ramonage-.+\.pdf$/);
    await context.close();
  });
}
