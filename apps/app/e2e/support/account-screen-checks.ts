import { test, type Browser, type ViewportSize } from "@playwright/test";
import { expectNoSeriousAccessibilityViolations } from "./accessibility";
import { type AccountScreensFixture, sharedAccountScreensFixture } from "./account-screens-fixture";
import { ACCOUNT_SCREENS, type AccountScreen, type AccountScreenKey } from "./account-screens";
import { assignClientIp } from "./client-ip";
import { expectTouchTargetsAtLeast48px } from "./touch-targets";
import { MOBILE, VIEWPORTS } from "./viewports";

const FIXTURE_TIMEOUT_MS = 180_000;

const openScreen = async (
  browser: Browser,
  screen: AccountScreen,
  fixture: AccountScreensFixture,
  viewport: Readonly<ViewportSize>,
) => {
  const context = await browser.newContext(
    screen.isSignedIn ? { viewport, storageState: fixture.ownerStatePath } : { viewport },
  );
  await assignClientIp(context);
  const page = await context.newPage();
  await screen.open(page, fixture);
  return { context, page };
};

const fixtureOf = async (browser: Browser) => {
  test.setTimeout(FIXTURE_TIMEOUT_MS);
  return sharedAccountScreensFixture(browser, test.info().project.outputDir);
};

export const checkAccessibilityOf = (keys: readonly AccountScreenKey[]) => {
  for (const key of keys) {
    const screen = ACCOUNT_SCREENS[key];
    for (const viewport of VIEWPORTS) {
      test(`the ${screen.name} has no serious accessibility violation on ${viewport.name}`, async ({
        browser,
      }) => {
        const fixture = await fixtureOf(browser);
        const { context, page } = await openScreen(browser, screen, fixture, viewport.size);
        await expectNoSeriousAccessibilityViolations(page);
        await context.close();
      });
    }
  }
};

export const checkTouchTargetsOf = (keys: readonly AccountScreenKey[]) => {
  for (const key of keys) {
    const screen = ACCOUNT_SCREENS[key];
    test(`the ${screen.name} has touch targets of at least 48 px on mobile`, async ({
      browser,
    }) => {
      const fixture = await fixtureOf(browser);
      const { context, page } = await openScreen(browser, screen, fixture, MOBILE);
      await expectTouchTargetsAtLeast48px(page);
      await context.close();
    });
  }
};
