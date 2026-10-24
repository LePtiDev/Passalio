import { expect, test } from "@playwright/test";
import {
  chooseOption,
  createIndividualCustomer,
  expectOnServer,
  expectUpToDate,
  newIndividualCustomer,
  serverCustomerFile,
} from "./support/customers";
import { openNewEquipment, photoInput, PNG_PHOTO, saveEquipment } from "./support/equipments";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  goOffline,
  goOnline,
  onboardFieldOwner,
} from "./support/field-context";
import { expectPendingCountAbove } from "./support/sync-control";
import { MOBILE } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

test("an equipment photo taken without network is kept on the phone and uploaded when the network is back", async ({
  browser,
}) => {
  const { context, page } = await onboardFieldOwner(browser, MOBILE);
  const customerId = await createIndividualCustomer(page, newIndividualCustomer());
  await expectUpToDate(page);

  await goOffline(page);
  await openNewEquipment(page);
  await chooseOption(page, "Ramonage et entretien", "Poêle à granulés");
  await photoInput(page, "Appareil").setInputFiles(PNG_PHOTO);
  await expect(page.getByRole("img", { name: "Appareil" })).toBeVisible();
  await saveEquipment(page);
  await expect(page.getByRole("img", { name: "Photo de l'appareil" })).toBeVisible();
  await expectPendingCountAbove(page, 1);

  const beforeSync = await serverCustomerFile(context.request, customerId);
  expect(beforeSync?.equipments).toEqual([]);
  expect(beforeSync?.photos).toEqual([]);

  await goOnline(page);
  await expectUpToDate(page);
  await expectOnServer(
    context.request,
    customerId,
    ({ equipments, photos }) =>
      equipments.some(({ kind }) => kind === "pellet_stove") &&
      photos.some(({ kind }) => kind === "overview"),
  );
  await context.close();
});
