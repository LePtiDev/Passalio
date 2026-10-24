import { expect, test, type Page } from "@playwright/test";
import { openAdminSession } from "./support/platform-admin";
import { uniqueToken } from "./support/prospects";
import { MOBILE, VIEWPORTS } from "./support/viewports";

const memberRow = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByText(name, { exact: true }) });

const openMemberAction = async (page: Page, name: string, action: string) => {
  if (page.viewportSize()?.width === MOBILE.width) {
    await page.getByRole("button", { name: `Actions pour ${name}` }).click();
    await page.getByRole("menuitem", { name: action }).click();
    return;
  }
  await memberRow(page, name).getByRole("button", { name: action }).click();
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });
    test.describe.configure({ timeout: 90_000 });

    test("removing a member closes the sessions they already had open", async ({ browser }) => {
      const superadmin = await openAdminSession(browser, size, "superadmin");
      const member = await openAdminSession(browser, size, "sales", {
        firstName: "Odile",
        lastName: `Retiree${uniqueToken()}`,
      });
      const memberName = `${member.member.firstName} ${member.member.lastName}`;
      await expect(member.page.getByRole("heading", { name: "Entreprises" })).toBeVisible();

      await superadmin.page.goto("/admin/equipe");
      await expect(superadmin.page.getByRole("heading", { name: "Équipe Passalio" })).toBeVisible();
      await openMemberAction(superadmin.page, memberName, "Retirer");
      const removeDialog = superadmin.page.getByRole("alertdialog");
      await expect(
        removeDialog.getByRole("heading", { name: `Retirer ${memberName} de l'équipe ?` }),
      ).toBeVisible();
      await removeDialog.getByRole("button", { name: "Retirer de l'équipe" }).click();
      await expect(
        superadmin.page.getByText(`${memberName} ne fait plus partie de l'équipe.`),
      ).toBeVisible();

      await member.page.goto("/admin/entreprises");
      await expect(member.page).toHaveURL(/\/connexion/);
      await expect(member.page.getByRole("button", { name: "Se connecter" })).toBeVisible();
      const prospects = await member.page.request.get("/api/admin/prospects/companies");
      expect(prospects.ok()).toBe(false);
      await member.context.close();
      await superadmin.context.close();
    });
  });
}
