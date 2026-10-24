import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type ViewportSize,
} from "@playwright/test";
import { signIn } from "./support/accounts";
import {
  createIndividualCustomer,
  customerNameOf,
  expectUpToDate,
  newIndividualCustomer,
} from "./support/customers";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  onboardFieldOwner,
  openCustomerList,
  openFieldContext,
} from "./support/field-context";
import {
  cutSyncRoute,
  failSyncRoute,
  SHORT_FAILURE_CODE,
  SYNC_PULL_ROUTE,
} from "./support/sync-control";
import { VIEWPORTS } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

const LOAD_ERROR = "Impossible de récupérer vos clients. Vérifiez votre connexion puis réessayez.";

const openListOnNewDevice = async (
  browser: Browser,
  size: ViewportSize,
  block: (context: BrowserContext) => Promise<void>,
) => {
  const { context, page, owner } = await onboardFieldOwner(browser, size);
  const customer = newIndividualCustomer();
  await createIndividualCustomer(page, customer);
  await expectUpToDate(page);

  const device = await openFieldContext(browser, size);
  await block(device);
  const devicePage = await device.newPage();
  await signIn(devicePage, owner);
  await expect(
    devicePage.getByRole("heading", { name: `Bonjour ${owner.firstName}` }),
  ).toBeVisible();
  await openCustomerList(devicePage);
  const alert = devicePage.getByRole("alert").filter({ hasText: LOAD_ERROR });
  await expect(alert).toBeVisible({ timeout: 15_000 });
  const row = devicePage.getByRole("link", { name: new RegExp(customerNameOf(customer)) });
  const close = async () => {
    await device.close();
    await context.close();
  };
  return { device, devicePage, alert, row, close };
};

for (const { name: viewportName, size } of VIEWPORTS) {
  test.describe(`on ${viewportName}`, () => {
    test("on a new device, a server error during the first synchronization shows its short trace id and a retry", async ({
      browser,
    }) => {
      const { device, devicePage, alert, row, close } = await openListOnNewDevice(
        browser,
        size,
        (context) => failSyncRoute(context, SYNC_PULL_ROUTE),
      );
      await expect(alert).toContainText(SHORT_FAILURE_CODE);
      await expect(row).toHaveCount(0);

      await device.unroute(SYNC_PULL_ROUTE);
      await alert.getByRole("button", { name: "Réessayer" }).click();
      await expect(row).toBeVisible({ timeout: 15_000 });
      await expect(alert).toBeHidden();
      await expect(
        devicePage.getByRole("heading", { name: "Ajoutez votre premier client" }),
      ).toHaveCount(0);
      await close();
    });

    test("on a new device that cannot reach the server, the list shows the error instead of an empty list", async ({
      browser,
    }) => {
      const { device, devicePage, alert, row, close } = await openListOnNewDevice(
        browser,
        size,
        (context) => cutSyncRoute(context, SYNC_PULL_ROUTE),
      );
      await expect(
        devicePage.getByRole("heading", { name: "Ajoutez votre premier client" }),
      ).toHaveCount(0);
      await expect(row).toHaveCount(0);

      await device.unroute(SYNC_PULL_ROUTE);
      await alert.getByRole("button", { name: "Réessayer" }).click();
      await expect(row).toBeVisible({ timeout: 15_000 });
      await expect(alert).toBeHidden();
      await close();
    });
  });
}
