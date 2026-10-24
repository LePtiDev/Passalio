import { expect, test } from "@playwright/test";
import {
  createIndividualCustomer,
  expectOnServer,
  expectUpToDate,
  newIndividualCustomer,
  visible,
} from "./support/customers";
import {
  addInsert,
  chooseEnergy,
  chooseEquipmentKind,
  chooseFlueType,
  openNewEquipment,
  photoInput,
  PNG_PHOTO,
  saveEquipment,
} from "./support/equipments";
import { FIELD_JOURNEY_TIMEOUT_MS, onboardFieldOwner } from "./support/field-context";
import { MOBILE, VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS * 2 });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("an equipment of each family is added with the fields of its family", async ({
      browser,
    }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customerId = await createIndividualCustomer(page, newIndividualCustomer());

      await openNewEquipment(page);
      await page.getByRole("button", { name: "Ajouter l'appareil" }).click();
      await expect(page.getByText("Choisissez le type d'appareil.")).toBeVisible();
      await chooseEquipmentKind(page, "Insert");
      await expect(page.getByLabel("Combustible", { exact: true })).toContainText("Bûches");
      await expect(page.getByLabel("Fluide frigorigène")).toHaveCount(0);
      await page.getByLabel("Marque").fill("Invicta");
      await page.getByLabel("Pièce").fill("Salon");
      await chooseFlueType(page, "Maçonné tubé");
      await page.getByLabel("Repère").fill("souche côté rue");
      await saveEquipment(page);
      await expect(visible(page, "Insert bois · Invicta")).toBeVisible();
      await expect(visible(page, "Salon · conduit maçonné tubé · souche côté rue")).toBeVisible();

      await openNewEquipment(page);
      await chooseEquipmentKind(page, "Chaudière");
      await chooseEnergy(page, "Fioul");
      await chooseFlueType(page, "Ventouse");
      await saveEquipment(page);
      await expect(visible(page, "Chaudière fioul")).toBeVisible();
      await expect(visible(page, "conduit ventouse")).toBeVisible();

      await openNewEquipment(page);
      await chooseEquipmentKind(page, "PAC air/eau");
      await expect(page.getByLabel("Combustible", { exact: true })).toHaveCount(0);
      await expect(page.getByRole("combobox", { name: /Type de conduit/ })).toHaveCount(0);
      await expect(page.getByLabel("Pièce")).toHaveCount(0);
      await page.getByLabel("Marque").fill("Atlantic");
      await page.getByLabel("Puissance (kW)").fill("8");
      await page.getByLabel("Fluide frigorigène").fill("R32");
      await page.getByLabel("Charge (kg)").fill("1,2");
      await page.getByLabel("Unité extérieure").fill("Jardin");
      await saveEquipment(page);
      await expect(visible(page, "PAC air/eau · Atlantic")).toBeVisible();
      await expect(visible(page, "R32, 1,20 kg")).toBeVisible();

      await expectUpToDate(page);
      await expectOnServer(context.request, customerId, ({ equipments }) => {
        const insert = equipments.find(({ kind }) => kind === "insert");
        const boiler = equipments.find(({ kind }) => kind === "boiler");
        const heatPump = equipments.find(({ kind }) => kind === "air_to_water_heat_pump");
        return (
          insert?.energy === "wood_logs" &&
          insert.details?.["flueType"] === "lined_masonry" &&
          insert.details["flueLocation"] === "souche côté rue" &&
          boiler?.energy === "oil" &&
          boiler.details?.["flueType"] === "sealed_concentric" &&
          heatPump?.details?.["refrigerant"] === "R32" &&
          heatPump.details["refrigerantChargeKg"] === 1.2 &&
          heatPump.details["outdoorUnitLocation"] === "Jardin"
        );
      });
      await context.close();
    });

    test("a removed equipment stays in the history of the site", async ({ browser }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      const customerId = await createIndividualCustomer(page, newIndividualCustomer());
      await addInsert(page);

      await page.getByRole("button", { name: "Actions sur l'appareil" }).click();
      await page.getByRole("menuitem", { name: "Retirer" }).click();
      const dialog = page.getByRole("alertdialog", { name: "Retirer Insert bois · Invicta ?" });
      await expect(dialog).toContainText(
        "L'appareil passe dans l'historique avec ses attestations.",
      );
      await dialog.getByRole("button", { name: "Retirer" }).click();

      await expect(page.getByText("Appareil retiré. Il reste dans l'historique.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Appareils retirés (1)" })).toBeVisible();
      await expect(visible(page, /^retiré le /)).toBeVisible();
      await expect(page.getByRole("button", { name: "Actions sur l'appareil" })).toHaveCount(0);
      await expectUpToDate(page);
      await expectOnServer(context.request, customerId, ({ equipments }) =>
        equipments.some(({ kind, status }) => kind === "insert" && status === "removed"),
      );

      await page.reload();
      await expect(page.getByRole("button", { name: "Appareils retirés (1)" })).toBeVisible();
      await expect(visible(page, "Insert bois · Invicta")).toBeVisible();
      await context.close();
    });
  });
}

test("photos are offered on the phone and not on the computer", async ({ browser }) => {
  const desktop = await onboardFieldOwner(browser, VIEWPORTS[1].size);
  await createIndividualCustomer(desktop.page, newIndividualCustomer());
  await openNewEquipment(desktop.page);
  await expect(desktop.page.getByRole("heading", { name: "Photos" })).toBeHidden();
  await desktop.context.close();

  const mobile = await onboardFieldOwner(browser, MOBILE);
  const customerId = await createIndividualCustomer(mobile.page, newIndividualCustomer());
  await openNewEquipment(mobile.page);
  await expect(mobile.page.getByRole("heading", { name: "Photos" })).toBeVisible();
  await chooseEquipmentKind(mobile.page, "Poêle à granulés");
  await photoInput(mobile.page, "Appareil").setInputFiles(PNG_PHOTO);
  await expect(mobile.page.getByRole("img", { name: "Appareil" })).toBeVisible();
  await saveEquipment(mobile.page);
  await expect(mobile.page.getByRole("img", { name: "Photo de l'appareil" })).toBeVisible();
  await expectUpToDate(mobile.page);
  await expectOnServer(mobile.context.request, customerId, ({ photos }) =>
    photos.some(({ kind }) => kind === "overview"),
  );
  await mobile.context.close();
});
