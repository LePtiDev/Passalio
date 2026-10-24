import type { JournalPageResponse } from "@passalio/shared";
import { expect, test } from "@playwright/test";
import { ADMIN_STATE_FILE, loadAdminScreenFixtures } from "./support/admin-screen-fixtures";
import { apiPathIs, respondWithJson } from "./support/api-stubs";
import { assignClientIp } from "./support/client-ip";
import { VIEWPORTS } from "./support/viewports";

const NO_JOURNAL_ENTRIES: JournalPageResponse = { entries: [], nextCursor: null };

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("an empty journal explains what will appear and offers a main action", async ({
      browser,
    }) => {
      await loadAdminScreenFixtures(browser);
      const context = await browser.newContext({ viewport: size, storageState: ADMIN_STATE_FILE });
      await assignClientIp(context);
      const page = await context.newPage();
      await respondWithJson(page, apiPathIs("/admin/journal"), NO_JOURNAL_ENTRIES);

      await page.goto("/admin/journal");
      await expect(page.getByRole("heading", { name: "Journal", level: 1 })).toBeVisible();
      await expect(page.getByText("Rien dans le journal pour l'instant.")).toBeVisible();
      const main = page.getByRole("main");
      await expect(main.getByRole("button").or(main.getByRole("link")).first()).toBeVisible();
      await context.close();
    });
  });
}
