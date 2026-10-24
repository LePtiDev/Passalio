import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  ADMIN_STATE_FILE,
  INVITEE_STATE_FILE,
  loadAdminScreenFixtures,
  type AdminScreenFixtures,
} from "./support/admin-screen-fixtures";
import {
  apiPathIs,
  holdApi,
  shortTraceIdOf,
  uniqueTraceId,
  type ApiMatcher,
} from "./support/api-stubs";
import { assignClientIp } from "./support/client-ip";
import { blockMapTiles } from "./support/prospects";
import { VIEWPORTS } from "./support/viewports";

const GENERIC_ERROR = "Une erreur est survenue. Réessayez dans un instant.";
const TEAM_ERROR = "Impossible de charger l'équipe. Vérifiez votre connexion et réessayez.";
const ERROR_TIMEOUT = 30_000;

const lastSegment = (path: string) =>
  new URL(path, "http://localhost").pathname.split("/").at(-1) ?? "";

type ScreenState = {
  readonly isForInvitee?: boolean;
  readonly path: (fixtures: AdminScreenFixtures) => string;
  readonly api: (fixtures: AdminScreenFixtures) => ApiMatcher;
  readonly errorMessage?: string;
  readonly content: (page: Page, fixtures: AdminScreenFixtures) => Locator;
};

const firstOpenLink = (page: Page) => page.getByRole("link", { name: /^Ouvrir / }).first();

const SCREENS: Readonly<Record<string, ScreenState>> = {
  overview: {
    path: () => "/admin",
    api: () => apiPathIs("/admin/overview"),
    content: (page) => page.getByRole("main").getByRole("link", { name: /^Comptes clients \d+/ }),
  },
  "customer accounts": {
    path: () => "/admin/comptes",
    api: () => apiPathIs("/admin/accounts"),
    content: firstOpenLink,
  },
  "customer account file": {
    path: ({ accountPath }) => accountPath,
    api: ({ accountPath }) => apiPathIs(`/admin/accounts/${lastSegment(accountPath)}`),
    content: (page, { accountName }) => page.getByRole("heading", { name: accountName, level: 1 }),
  },
  journal: {
    path: () => "/admin/journal",
    api: () => apiPathIs("/admin/journal"),
    content: (page, { accountName }) => page.getByRole("link", { name: accountName }).first(),
  },
  "Passalio team": {
    path: () => "/admin/equipe",
    api: () => apiPathIs("/admin/team"),
    errorMessage: TEAM_ERROR,
    content: (page) => page.getByRole("heading", { name: "Invitations en attente" }),
  },
  "join the Passalio team": {
    isForInvitee: true,
    path: ({ invitationLink }) => new URL(invitationLink).pathname,
    api: ({ invitationLink }) => apiPathIs(`/team-invitations/${lastSegment(invitationLink)}`),
    content: (page) => page.getByRole("button", { name: "Rejoindre l'équipe" }),
  },
  "prospect companies": {
    path: () => "/admin/entreprises",
    api: () => apiPathIs("/admin/prospects/companies"),
    content: firstOpenLink,
  },
  "prospect company file": {
    path: ({ companyPath }) => companyPath,
    api: ({ companyPath }) => apiPathIs(`/admin/prospects/companies/${lastSegment(companyPath)}`),
    content: (page, { companyName }) => page.getByRole("heading", { name: companyName, level: 1 }),
  },
  "prospect contacts": {
    path: () => "/admin/contacts",
    api: () => apiPathIs("/admin/prospects/contacts"),
    content: firstOpenLink,
  },
  "prospect contact file": {
    path: ({ contactPath }) => contactPath,
    api: ({ contactPath }) => apiPathIs(`/admin/prospects/contacts/${lastSegment(contactPath)}`),
    content: (page, { contactName }) => page.getByRole("heading", { name: contactName, level: 1 }),
  },
  "prospection map": {
    path: () => "/admin/prospection",
    api: () => apiPathIs("/admin/prospects/companies"),
    content: (page) =>
      page
        .getByRole("region", { name: "Entreprise sélectionnée" })
        .getByRole("link", { name: "Ouvrir la fiche" }),
  },
};

const busyRegions = (page: Page) => page.locator("[aria-busy='true']");

for (const { name, size } of VIEWPORTS) {
  test.describe(`on ${name}`, () => {
    test.use({ viewport: size });

    for (const [screen, state] of Object.entries(SCREENS)) {
      test(`the ${screen} screen shows a skeleton while loading, then an error with a short trace id and a retry`, async ({
        browser,
      }) => {
        test.setTimeout(120_000);
        const fixtures = await loadAdminScreenFixtures(browser);
        const context = await browser.newContext({
          viewport: size,
          storageState: state.isForInvitee === true ? INVITEE_STATE_FILE : ADMIN_STATE_FILE,
        });
        await assignClientIp(context);
        await blockMapTiles(context);
        const page = await context.newPage();
        const api = await holdApi(page, state.api(fixtures));
        const traceId = uniqueTraceId();

        await page.goto(state.path(fixtures));
        await expect.poll(() => api.heldRequests()).toBeGreaterThan(0);
        await expect(busyRegions(page).filter({ visible: true }).first()).toBeVisible();
        await expect(state.content(page, fixtures)).toHaveCount(0);
        await expect(page.getByRole("alert").filter({ hasText: GENERIC_ERROR })).toHaveCount(0);

        api.fail(traceId);
        const alert = page
          .getByRole("alert")
          .filter({ hasText: state.errorMessage ?? GENERIC_ERROR });
        await expect(alert).toBeVisible({ timeout: ERROR_TIMEOUT });
        await expect(
          alert.getByText(`Code : ${shortTraceIdOf(traceId)}`, { exact: true }),
        ).toBeVisible();
        await expect(alert.getByText(traceId)).toHaveCount(0);
        await expect(state.content(page, fixtures)).toHaveCount(0);

        await api.restore();
        await alert.getByRole("button", { name: "Réessayer" }).click();
        await expect(state.content(page, fixtures)).toBeVisible();
        await expect(alert).toHaveCount(0);
        await expect(busyRegions(page)).toHaveCount(0);
        await context.close();
      });
    }

    test("a prospect company that no longer exists shows a message with a way back to the list", async ({
      browser,
    }) => {
      await loadAdminScreenFixtures(browser);
      const context = await browser.newContext({ viewport: size, storageState: ADMIN_STATE_FILE });
      await assignClientIp(context);
      const page = await context.newPage();

      await page.goto(`/admin/entreprises/${crypto.randomUUID()}`);
      await expect(page.getByText("Cette fiche n'existe plus")).toBeVisible();
      await expect(page.getByText("Elle a peut-être été supprimée.")).toBeVisible();
      await page.getByRole("link", { name: "Retour à la liste" }).click();
      await expect(page).toHaveURL(/\/admin\/entreprises$/);
      await expect(page.getByRole("heading", { name: "Entreprises", level: 1 })).toBeVisible();
      await context.close();
    });

    test("a prospect contact that no longer exists shows a message with a way back to the list", async ({
      browser,
    }) => {
      await loadAdminScreenFixtures(browser);
      const context = await browser.newContext({ viewport: size, storageState: ADMIN_STATE_FILE });
      await assignClientIp(context);
      const page = await context.newPage();

      await page.goto(`/admin/contacts/${crypto.randomUUID()}`);
      await expect(page.getByText("Cette fiche n'existe plus")).toBeVisible();
      await page.getByRole("link", { name: "Retour à la liste" }).click();
      await expect(page).toHaveURL(/\/admin\/contacts$/);
      await expect(page.getByRole("heading", { name: "Contacts", level: 1 })).toBeVisible();
      await context.close();
    });
  });
}
