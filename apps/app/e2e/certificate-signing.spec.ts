import { expect, test } from "@playwright/test";
import {
  drawSignature,
  fillLegalMentions,
  planVisitToday,
  serverDocumentCount,
} from "./support/certificate-signing";
import {
  createIndividualCustomer,
  customerNameOf,
  expectUpToDate,
  newIndividualCustomer,
} from "./support/customers";
import { addInsert } from "./support/equipments";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  goOffline,
  goOnline,
  onboardFieldOwner,
} from "./support/field-context";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS * 2 });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("the owner fills the certificate, completes the legal mentions when asked, and signs", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customer = newIndividualCustomer();
      const name = customerNameOf(customer);
      await createIndividualCustomer(page, customer);
      await addInsert(page);
      await expectUpToDate(page);
      await planVisitToday(page, { customerName: name, lastName: customer.lastName }, "10:00");

      await page
        .getByRole("link", { name: "Remplir le certificat" })
        .filter({ visible: true })
        .first()
        .click();
      await expect(
        page.getByRole("heading", { name: "Certificat de ramonage" }).first(),
      ).toBeVisible();
      await expect(page.getByText("Étape 1 sur 2")).toBeVisible();
      await page.getByRole("checkbox", { name: /Ramonage mécanique/ }).click();
      await page.getByText("Ramonage partiel").click();
      await page.getByRole("button", { name: "Continuer" }).click();
      await expect(
        page.getByText("Le certificat demande un ramonage mécanique de la paroi intérieure."),
      ).toBeVisible();
      await expect(page.getByText("Précisez la partie du conduit non accessible.")).toBeVisible();
      await page.getByRole("checkbox", { name: /Ramonage mécanique/ }).click();
      await page.getByLabel(/Partie non accessible/).fill("Coude dans les combles");
      await page.getByRole("button", { name: "Bistre ou goudron" }).click();
      await page.getByLabel("Précision").fill("bistre sur 2 m, débistrage conseillé");
      await page.getByRole("button", { name: "Continuer" }).click();

      await expect(page.getByText("Étape 2 sur 2")).toBeVisible();
      await expect(page.getByText(/Ramonage partiel · Bistre ou goudron/)).toBeVisible();
      await page.getByRole("button", { name: "Signer le certificat" }).click();
      await expect(page.getByText("Signez en tant que technicien.")).toBeVisible();
      await expect(
        page.getByText("Faites signer le client ou cochez « Client absent »."),
      ).toBeVisible();
      await drawSignature(page, /^Signature du technicien/);
      await drawSignature(page, /^Signature du client/);
      await page.getByRole("button", { name: "Signer le certificat" }).click();

      const sheet = page.getByRole("dialog", { name: "Avant votre premier certificat" });
      await expect(sheet).toBeVisible();
      await fillLegalMentions(page);
      await sheet.getByRole("button", { name: "Enregistrer et signer" }).click();

      await expect(page.getByRole("heading", { name: "Certificat signé" })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByText(/certificat-ramonage-.+\.pdf/)).toBeVisible();
      await expect(page.getByRole("link", { name: "Voir le PDF" })).toBeVisible({
        timeout: 20_000,
      });
      const download = page.waitForEvent("download");
      await page.getByRole("link", { name: "Télécharger" }).click();
      expect((await download).suggestedFilename()).toMatch(/^certificat-ramonage-.+\.pdf$/);
      await expect(page.getByText("Enregistré sur le serveur")).toBeVisible({ timeout: 20_000 });
      await expect.poll(() => serverDocumentCount(context.request)).toBe(1);

      await page.getByRole("link", { name: "Retour au passage" }).click();
      await expect(page.getByText("Terminé").filter({ visible: true }).first()).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Voir les certificats" }).filter({ visible: true }).first(),
      ).toBeVisible();
      await context.close();
    });
  });
}

test("the technician signs offline with the customer absent, and the certificate reaches the server later", async ({
  browser,
}) => {
  const { context, page } = await onboardFieldOwner(browser, VIEWPORTS[0].size);
  const customer = newIndividualCustomer();
  const name = customerNameOf(customer);
  await createIndividualCustomer(page, customer);
  await addInsert(page);
  await expectUpToDate(page);
  await page.goto("/reglages/entreprise");
  await fillLegalMentions(page);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Réglages enregistrés.")).toBeVisible();
  await planVisitToday(page, { customerName: name, lastName: customer.lastName }, "14:00");

  await goOffline(page);
  await page
    .getByRole("link", { name: "Remplir le certificat" })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await drawSignature(page, /^Signature du technicien/);
  await page.getByRole("checkbox", { name: "Client absent" }).click();
  await page.getByRole("button", { name: "Signer le certificat" }).click();
  await expect(page.getByRole("heading", { name: "Certificat signé" })).toBeVisible();
  await expect(page.getByText("En attente d'envoi au serveur")).toBeVisible();

  await goOnline(page);
  await expect(page.getByText("Enregistré sur le serveur")).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => serverDocumentCount(context.request)).toBe(1);
  await page.reload();
  await expect(page.getByRole("link", { name: "Voir le PDF" })).toBeVisible({ timeout: 20_000 });
  await context.close();
});
