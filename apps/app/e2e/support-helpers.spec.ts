import { expect, test } from "@playwright/test";
import {
  expectNoSeriousAccessibilityViolations,
  seriousAccessibilityViolations,
} from "./support/accessibility";
import { signUpAndOnboardOwner, uniqueEmail } from "./support/accounts";
import { assignClientIp } from "./support/client-ip";
import { emailLinkSentBy } from "./support/email-links";
import { smallTouchTargets } from "./support/touch-targets";
import { DESKTOP, MOBILE } from "./support/viewports";

test("the touch target check reports only the controls smaller than 48 px", async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.setContent(`
    <main>
      <button style="width: 48px; height: 48px">Grand</button>
      <button style="width: 32px; height: 20px">Petit</button>
      <label style="display: flex; height: 48px; width: 200px">
        <input type="checkbox" style="width: 16px; height: 16px" /> Conditions
      </label>
      <a href="/x" style="display: inline-block; height: 20px; width: 20px" aria-hidden="true">x</a>
      <button style="display: none">Caché</button>
    </main>
  `);

  expect(await smallTouchTargets(page)).toEqual([
    { element: "<button> Petit", width: 32, height: 20 },
  ]);
});

test("the accessibility check reports serious violations and passes a clean page", async ({
  page,
}) => {
  await page.setContent(
    `<html lang="fr"><head><title>Essai</title></head><body><main><button></button></main></body></html>`,
  );
  const violations = await seriousAccessibilityViolations(page);
  expect(violations.map(({ id }) => id)).toContain("button-name");

  await page.setContent(
    `<html lang="fr"><head><title>Essai</title></head><body><main><h1>Essai</h1><button>Valider</button></main></body></html>`,
  );
  await expectNoSeriousAccessibilityViolations(page);
});

test("two fresh owners onboard one after the other with unique emails", async ({ browser }) => {
  const mobile = await browser.newContext({ viewport: MOBILE });
  const desktop = await browser.newContext({ viewport: DESKTOP });
  await assignClientIp(mobile);
  await assignClientIp(desktop);

  const firstOwner = await signUpAndOnboardOwner(await mobile.newPage());
  const secondOwner = await signUpAndOnboardOwner(await desktop.newPage(), {
    account: { firstName: "Paul" },
  });

  expect(firstOwner.email).not.toBe(secondOwner.email);
  expect(secondOwner.firstName).toBe("Paul");
  await mobile.close();
  await desktop.close();
});

test("the email helper returns the link sent by the action", async ({ page }) => {
  await assignClientIp(page.context());
  const owner = await signUpAndOnboardOwner(page, {
    account: { firstName: "Lucie", email: uniqueEmail("lien") },
  });
  await page.context().clearCookies();
  await page.goto("/connexion");
  await expect(page.getByRole("button", { name: "Recevoir un lien de connexion" })).toBeVisible();
  await page.getByLabel("Adresse email").fill(owner.email);

  const link = await emailLinkSentBy("magic_link", async () => {
    await page.getByRole("button", { name: "Recevoir un lien de connexion" }).click();
    await expect(page.getByText("Vérifiez votre boîte mail")).toBeVisible();
  });

  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Bonjour Lucie" })).toBeVisible();
});
