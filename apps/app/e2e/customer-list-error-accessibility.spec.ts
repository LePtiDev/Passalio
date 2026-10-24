import { expect, test, type Browser, type ViewportSize } from "@playwright/test";
import { signIn } from "./support/accounts";
import {
  expectNoSeriousAccessibilityViolations,
  seriousAccessibilityViolations,
} from "./support/accessibility";
import {
  FIELD_JOURNEY_TIMEOUT_MS,
  onboardFieldOwner,
  openCustomerList,
  openFieldContext,
} from "./support/field-context";
import { failSyncRoute, SYNC_PULL_ROUTE } from "./support/sync-control";
import { smallTouchTargets } from "./support/touch-targets";
import { DESKTOP, MOBILE } from "./support/viewports";

test.describe.configure({ timeout: FIELD_JOURNEY_TIMEOUT_MS });

const openFailedListOnNewDevice = async (browser: Browser, size: ViewportSize) => {
  const owner = await onboardFieldOwner(browser, size);
  await owner.context.close();
  const device = await openFieldContext(browser, size);
  await failSyncRoute(device, SYNC_PULL_ROUTE);
  const page = await device.newPage();
  await signIn(page, owner.owner);
  await expect(
    page.getByRole("heading", { name: `Bonjour ${owner.owner.firstName}` }),
  ).toBeVisible();
  await openCustomerList(page);
  await expect(page.getByRole("alert").getByRole("button", { name: "Réessayer" })).toBeVisible({
    timeout: 15_000,
  });
  return { device, page };
};

test("the customer list whose first synchronization failed has no serious accessibility violation and 48 px touch targets on mobile", async ({
  browser,
}) => {
  const { device, page } = await openFailedListOnNewDevice(browser, MOBILE);
  const violations = await seriousAccessibilityViolations(page);
  const smallTargets = await smallTouchTargets(page);
  expect({ violations, smallTargets }).toEqual({ violations: [], smallTargets: [] });
  await device.close();
});

test("the customer list whose first synchronization failed has no serious accessibility violation on desktop", async ({
  browser,
}) => {
  const { device, page } = await openFailedListOnNewDevice(browser, DESKTOP);
  await expectNoSeriousAccessibilityViolations(page);
  await device.close();
});
