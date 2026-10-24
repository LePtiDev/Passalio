import { expect, test } from "@playwright/test";
import { createIndividualCustomer, newIndividualCustomer } from "./support/customers";
import { OVERSIZED_PHOTO, openNewEquipment, PDF_FILE, photoInput } from "./support/equipments";
import { FIELD_JOURNEY_TIMEOUT_MS, onboardFieldOwner } from "./support/field-context";
import { MOBILE } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

const REFUSAL = /photo|fichier|image/i;

for (const { label, file } of [
  { label: "a file that is not an image", file: PDF_FILE },
  { label: "a photo larger than 5 MB", file: OVERSIZED_PHOTO },
]) {
  test(`${label} is refused when picked as an equipment photo`, async ({ browser }) => {
    const { context, page } = await onboardFieldOwner(browser, MOBILE);
    await createIndividualCustomer(page, newIndividualCustomer());
    await openNewEquipment(page);

    await photoInput(page, "Appareil").setInputFiles(file);

    await expect(page.getByRole("img", { name: "Appareil" })).toHaveCount(0);
    await expect(
      page.getByRole("alert").or(page.getByRole("status")).filter({ hasText: REFUSAL }),
    ).toBeVisible();
    await context.close();
  });
}
