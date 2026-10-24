import { expect, test } from "@playwright/test";
import { editCustomerField } from "./support/customer-screens";
import {
  createIndividualCustomer,
  expectUpToDate,
  newIndividualCustomer,
  syncIndicator,
  visible,
} from "./support/customers";
import { FIELD_JOURNEY_TIMEOUT_MS, onboardFieldOwner } from "./support/field-context";
import { failSyncRoute, SHORT_FAILURE_CODE, SYNC_PUSH_ROUTE } from "./support/sync-control";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("a failing synchronization shows the short trace id of the error", async ({ browser }) => {
      const { context, page } = await onboardFieldOwner(browser, size);
      await createIndividualCustomer(page, newIndividualCustomer());
      await expectUpToDate(page);

      await failSyncRoute(context, SYNC_PUSH_ROUTE);
      await editCustomerField(page, "Email", "code@exemple.fr");
      await expect(syncIndicator(page, "Synchronisation en échec")).toBeVisible({
        timeout: 15_000,
      });
      await expect(visible(page, SHORT_FAILURE_CODE)).toBeVisible();
      await context.close();
    });
  });
}
