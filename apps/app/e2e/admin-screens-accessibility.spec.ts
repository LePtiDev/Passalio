import { test, type Page, type ViewportSize } from "@playwright/test";
import { expectNoSeriousAccessibilityViolations } from "./support/accessibility";
import { ADMIN_SCREENS, type AdminScreenName } from "./support/admin-screens";
import { expectTouchTargetsAtLeast48px } from "./support/touch-targets";
import { DESKTOP, MOBILE } from "./support/viewports";

type Check = {
  readonly viewport: ViewportSize;
  readonly run: (page: Page) => Promise<void>;
};

const CHECKS = {
  "no serious accessibility violation on desktop": {
    viewport: DESKTOP,
    run: expectNoSeriousAccessibilityViolations,
  },
  "no serious accessibility violation on mobile": {
    viewport: MOBILE,
    run: expectNoSeriousAccessibilityViolations,
  },
  "touch targets of at least 48 px on mobile": {
    viewport: MOBILE,
    run: expectTouchTargetsAtLeast48px,
  },
} as const satisfies Readonly<Record<string, Check>>;

type CheckName = keyof typeof CHECKS;

const CASES: readonly (readonly [AdminScreenName, CheckName])[] = [
  ["two-factor setup", "no serious accessibility violation on desktop"],
  ["two-factor setup", "no serious accessibility violation on mobile"],
  ["sign-in code", "no serious accessibility violation on desktop"],
  ["sign-in code", "no serious accessibility violation on mobile"],
  ["sign-in backup code", "no serious accessibility violation on desktop"],
  ["sign-in backup code", "no serious accessibility violation on mobile"],
  ["admin code", "no serious accessibility violation on desktop"],
  ["admin code", "no serious accessibility violation on mobile"],
  ["overview", "no serious accessibility violation on mobile"],
  ["customer account file", "no serious accessibility violation on mobile"],
  ["journal", "no serious accessibility violation on mobile"],
  ["Passalio team", "touch targets of at least 48 px on mobile"],
  ["join the Passalio team", "no serious accessibility violation on desktop"],
  ["join the Passalio team", "no serious accessibility violation on mobile"],
  ["prospect contact file", "touch targets of at least 48 px on mobile"],
  ["prospection map", "no serious accessibility violation on mobile"],
  ["prospection map", "touch targets of at least 48 px on mobile"],
  ["two-factor setup", "touch targets of at least 48 px on mobile"],
  ["sign-in code", "touch targets of at least 48 px on mobile"],
  ["sign-in backup code", "touch targets of at least 48 px on mobile"],
  ["admin code", "touch targets of at least 48 px on mobile"],
  ["join the Passalio team", "touch targets of at least 48 px on mobile"],
  ["customer accounts", "touch targets of at least 48 px on mobile"],
  ["customer account file", "touch targets of at least 48 px on mobile"],
  ["prospect companies", "touch targets of at least 48 px on mobile"],
  ["prospect contacts", "touch targets of at least 48 px on mobile"],
  ["overview", "touch targets of at least 48 px on mobile"],
  ["journal", "touch targets of at least 48 px on mobile"],
];

for (const [screen, checkName] of CASES) {
  test(`the ${screen} screen has ${checkName}`, async ({ browser }) => {
    test.setTimeout(120_000);
    const check = CHECKS[checkName];
    const { context, page } = await ADMIN_SCREENS[screen](browser, check.viewport);
    await check.run(page);
    await context.close();
  });
}
