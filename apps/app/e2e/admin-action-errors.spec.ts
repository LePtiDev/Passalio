import { expect, test, type Browser, type Page, type ViewportSize } from "@playwright/test";
import { ADMIN_STATE_FILE, loadAdminScreenFixtures } from "./support/admin-screen-fixtures";
import { apiPathIs, holdApi, shortTraceIdOf, uniqueTraceId } from "./support/api-stubs";
import { assignClientIp } from "./support/client-ip";
import { openAdminSession } from "./support/platform-admin";
import { createProspectCompany, uniqueToken } from "./support/prospects";
import { VIEWPORTS } from "./support/viewports";

const GENERIC_ERROR = "Une erreur est survenue. Réessayez dans un instant.";

const openStoredAdmin = async (browser: Browser, viewport: ViewportSize) => {
  await loadAdminScreenFixtures(browser);
  const context = await browser.newContext({ viewport, storageState: ADMIN_STATE_FILE });
  await assignClientIp(context);
  const page = await context.newPage();
  return { context, page };
};

const errorToast = (page: Page) => page.getByRole("listitem").filter({ hasText: GENERIC_ERROR });

const expectErrorToastWithCode = async (page: Page, traceId: string) => {
  const toast = errorToast(page);
  await expect(toast).toBeVisible();
  await expect(toast.getByText(`Code : ${shortTraceIdOf(traceId)}`, { exact: true })).toBeVisible();
};

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    test("a prospect company the server refuses to create shows the error with a short trace id and keeps the form", async ({
      browser,
    }) => {
      const { context, page } = await openStoredAdmin(browser, size);
      const companyName = `Ramonage Refuse ${uniqueToken()}`;
      const create = await holdApi(page, apiPathIs("/admin/prospects/companies"), "POST");
      const traceId = uniqueTraceId();

      await page.goto("/admin/entreprises");
      await expect(page.getByRole("heading", { name: "Entreprises", level: 1 })).toBeVisible();
      await page.getByRole("button", { name: "Nouvelle entreprise" }).click();
      const dialog = page.getByRole("dialog", { name: "Nouvelle entreprise" });
      await expect(dialog).toBeVisible();
      await dialog.getByLabel("Nom", { exact: true }).fill(companyName);
      await dialog.getByLabel("Département").fill("94");
      await dialog.getByRole("button", { name: "Créer l'entreprise" }).click();

      await expect.poll(() => create.heldRequests()).toBe(1);
      await expect(dialog.getByRole("button", { name: "Créer l'entreprise" })).toBeDisabled();
      create.fail(traceId);
      await expectErrorToastWithCode(page, traceId);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel("Nom", { exact: true })).toHaveValue(companyName);
      await expect(page.getByText(`${companyName} est ajoutée.`)).toHaveCount(0);

      await create.restore();
      await dialog.getByRole("button", { name: "Créer l'entreprise" }).click();
      await expect(page.getByText(`${companyName} est ajoutée.`)).toBeVisible();
      await expect(page.getByRole("heading", { name: companyName, level: 1 })).toBeVisible();
      await context.close();
    });

    test("a stage change the server refuses shows the error with a short trace id and leaves the stage unchanged", async ({
      browser,
    }) => {
      const { context, page } = await openStoredAdmin(browser, size);
      const companyName = `Ramonage Etape ${uniqueToken()}`;
      const companyId = await createProspectCompany(page, { name: companyName, department: "94" });
      const stage = await holdApi(
        page,
        apiPathIs(`/admin/prospects/companies/${companyId}/stage`),
        "POST",
      );
      const traceId = uniqueTraceId();
      stage.fail(traceId);

      await page.goto(`/admin/entreprises/${companyId}`);
      await expect(page.getByRole("heading", { name: companyName, level: 1 })).toBeVisible();
      await page.getByRole("button", { name: "Changer l'étape" }).click();
      await page.getByRole("menuitemradio", { name: "Intéressée", exact: true }).click();

      await expectErrorToastWithCode(page, traceId);
      await expect(page.getByText(`${companyName} est intéressée.`)).toHaveCount(0);
      await stage.restore();
      await page.reload();
      await expect(page.getByRole("heading", { name: companyName, level: 1 })).toBeVisible();
      await expect(page.getByText("Étape passée à Intéressée.")).toHaveCount(0);
      await page.getByRole("button", { name: "Changer l'étape" }).click();
      await expect(page.getByRole("menuitemradio", { name: "À qualifier" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await context.close();
    });

    test("a note the server refuses shows the error with a short trace id and is not added to the history", async ({
      browser,
    }) => {
      const { context, page } = await openStoredAdmin(browser, size);
      const companyName = `Ramonage Note ${uniqueToken()}`;
      const companyId = await createProspectCompany(page, { name: companyName, department: "94" });
      const note = await holdApi(
        page,
        apiPathIs(`/admin/prospects/companies/${companyId}/notes`),
        "POST",
      );
      const traceId = uniqueTraceId();
      const noteText = `Rappeler jeudi ${uniqueToken()}`;

      await page.goto(`/admin/entreprises/${companyId}`);
      await expect(page.getByRole("heading", { name: companyName, level: 1 })).toBeVisible();
      await expect(page.getByText("Aucune note pour l'instant.")).toBeVisible();
      await page.getByLabel("Ajouter une note").fill(noteText);
      await page.getByRole("button", { name: "Ajouter", exact: true }).last().click();

      await expect.poll(() => note.heldRequests()).toBe(1);
      await expect(
        page.getByRole("button", { name: "Ajouter", exact: true }).last(),
      ).toBeDisabled();
      note.fail(traceId);
      await expectErrorToastWithCode(page, traceId);
      await expect(page.getByText("Note ajoutée.")).toHaveCount(0);
      await note.restore();
      await page.reload();
      await expect(page.getByText("Aucune note pour l'instant.")).toBeVisible();
      await expect(page.getByText(noteText)).toHaveCount(0);
      await context.close();
    });

    test("an invitation the server refuses shows the error with a short trace id and keeps the dialog open", async ({
      browser,
    }) => {
      const { context, page } = await openStoredAdmin(browser, size);
      const invite = await holdApi(page, apiPathIs("/admin/team/invitations"), "POST");
      const traceId = uniqueTraceId();
      const email = `refus-${uniqueToken()}@example.fr`;

      await page.goto("/admin/equipe");
      await expect(page.getByRole("heading", { name: "Équipe Passalio", level: 1 })).toBeVisible();
      await page.getByRole("button", { name: "Inviter un membre" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByLabel("E-mail")).toBeVisible();
      await dialog.getByLabel("E-mail").fill(email);
      await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();

      await expect.poll(() => invite.heldRequests()).toBe(1);
      await expect(dialog.getByRole("button", { name: "Envoi…" })).toBeDisabled();
      invite.fail(traceId);
      await expectErrorToastWithCode(page, traceId);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel("E-mail")).toHaveValue(email);
      await expect(page.getByText(`Invitation envoyée à ${email}.`)).toHaveCount(0);
      await invite.restore();
      await context.close();
    });

    test("inviting someone who is already in the Passalio team is refused under the email field", async ({
      browser,
    }) => {
      const { context, page, member } = await openAdminSession(browser, size, "superadmin");

      await page.goto("/admin/equipe");
      await expect(page.getByRole("heading", { name: "Équipe Passalio", level: 1 })).toBeVisible();
      await page.getByRole("button", { name: "Inviter un membre" }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByLabel("E-mail")).toBeVisible();
      await dialog.getByLabel("E-mail").fill(member.email);
      await dialog.getByRole("button", { name: "Envoyer l'invitation" }).click();

      await expect(dialog.getByText("Cette personne fait déjà partie de l'équipe.")).toBeVisible();
      await expect(dialog).toBeVisible();
      await expect(page.getByText(`Invitation envoyée à ${member.email}.`)).toHaveCount(0);
      await context.close();
    });
  });
}
