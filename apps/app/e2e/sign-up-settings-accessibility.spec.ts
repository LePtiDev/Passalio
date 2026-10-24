import { expect, test, type Page } from "@playwright/test";
import { expectNoSeriousAccessibilityViolations } from "./support/accessibility";
import { openAdminSession } from "./support/platform-admin";
import { expectTouchTargetsAtLeast48px } from "./support/touch-targets";
import { MOBILE, VIEWPORTS } from "./support/viewports";

const showClosedSignUp = async (page: Page) => {
  await page.route("**/api/sign-up-availability", (route) =>
    route.fulfill({ json: { isSignUpOpen: false } }),
  );
  await page.goto("/inscription");
  await expect(
    page.getByRole("heading", { name: "Les inscriptions sont fermées pour le moment" }),
  ).toBeVisible();
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });
    test.describe.configure({ timeout: 90_000 });

    test("the admin settings and the close confirmation have no serious accessibility violation", async ({
      browser,
    }) => {
      const superadmin = await openAdminSession(browser, size, "superadmin");
      const { page } = superadmin;
      await page.goto("/admin/reglages");
      const signUpSwitch = page.getByRole("switch", { name: "Autoriser les inscriptions" });
      await expect(signUpSwitch).toBeChecked();
      await expectNoSeriousAccessibilityViolations(page);
      if (size.width === MOBILE.width) {
        await expectTouchTargetsAtLeast48px(page);
      }

      await signUpSwitch.click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await expectNoSeriousAccessibilityViolations(page);
      await page.getByRole("button", { name: "Annuler" }).click();
      await expect(signUpSwitch).toBeChecked();
      await superadmin.context.close();
    });

    test("the closed sign-up screen has no serious accessibility violation", async ({ page }) => {
      await showClosedSignUp(page);
      await expectNoSeriousAccessibilityViolations(page);
      if (size.width === MOBILE.width) {
        await expectTouchTargetsAtLeast48px(page);
      }
    });
  });
}
