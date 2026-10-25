import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type ViewportSize,
} from "@playwright/test";
import { fillSignUpForm, newAccount } from "./accounts";
import {
  ADMIN_STATE_FILE,
  INVITEE_STATE_FILE,
  loadAdminScreenFixtures,
  type AdminScreenFixtures,
} from "./admin-screen-fixtures";
import { assignClientIp } from "./client-ip";
import {
  ageTwoFactorVerification,
  grantPlatformRole,
  openAdminSession,
  signInWithCode,
} from "./platform-admin";
import { blockMapTiles } from "./prospects";

export type ScreenSession = { readonly context: BrowserContext; readonly page: Page };

type OpenScreen = (browser: Browser, viewport: ViewportSize) => Promise<ScreenSession>;

type StoredScreen = {
  readonly isForInvitee?: boolean;
  readonly path: (fixtures: AdminScreenFixtures) => string;
  readonly heading: (fixtures: AdminScreenFixtures) => string;
  readonly ready?: (page: Page, fixtures: AdminScreenFixtures) => Promise<void>;
};

const openStored =
  ({ isForInvitee = false, path, heading, ready }: StoredScreen): OpenScreen =>
  async (browser, viewport) => {
    const fixtures = await loadAdminScreenFixtures(browser);
    const context = await browser.newContext({
      viewport,
      storageState: isForInvitee ? INVITEE_STATE_FILE : ADMIN_STATE_FILE,
    });
    await assignClientIp(context);
    await blockMapTiles(context);
    const page = await context.newPage();
    await page.goto(path(fixtures));
    await expect(page.getByRole("heading", { name: heading(fixtures), level: 1 })).toBeVisible();
    await ready?.(page, fixtures);
    return { context, page };
  };

const firstOpenLink = async (page: Page) => {
  await expect(page.getByRole("link", { name: /^Ouvrir / }).first()).toBeVisible();
};

const openTwoFactorSetup: OpenScreen = async (browser, viewport) => {
  const context = await browser.newContext({ viewport });
  await assignClientIp(context);
  const page = await context.newPage();
  const account = newAccount();
  await page.goto("/inscription");
  await fillSignUpForm(page, account);
  await expect(page).toHaveURL(/\/configuration\/entreprise/);
  await grantPlatformRole(account.email, "admin");
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Activez la double authentification" }),
  ).toBeVisible();
  return { context, page };
};

const openSignInCode: OpenScreen = async (browser, viewport) => {
  const { context, page, member } = await openAdminSession(browser, viewport, "admin");
  await context.clearCookies();
  await signInWithCode(page, member);
  return { context, page };
};

const openSignInBackupCode: OpenScreen = async (browser, viewport) => {
  const session = await openSignInCode(browser, viewport);
  await session.page.getByRole("button", { name: "Utiliser un code de secours" }).click();
  await expect(session.page.getByLabel("Code de secours")).toBeVisible();
  return session;
};

const openAdminCode: OpenScreen = async (browser, viewport) => {
  const { context, page, member } = await openAdminSession(browser, viewport, "superadmin");
  await ageTwoFactorVerification(member.email, 13);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/code/);
  await expect(page.getByRole("heading", { name: "Code de vérification" })).toBeVisible();
  return { context, page };
};

export const ADMIN_SCREENS = {
  "two-factor setup": openTwoFactorSetup,
  "sign-in code": openSignInCode,
  "sign-in backup code": openSignInBackupCode,
  "admin code": openAdminCode,
  overview: openStored({
    path: () => "/admin",
    heading: () => "Vue d'ensemble",
    ready: async (page) => {
      await expect(
        page.getByRole("main").getByRole("link", { name: /^Comptes clients \d+/ }),
      ).toBeVisible();
    },
  }),
  "customer accounts": openStored({
    path: () => "/admin/comptes",
    heading: () => "Comptes clients",
    ready: firstOpenLink,
  }),
  "customer account file": openStored({
    path: ({ accountPath }) => accountPath,
    heading: ({ accountName }) => accountName,
    ready: async (page) => {
      await expect(page.getByRole("tabpanel").getByText("Louise Martin")).toBeVisible();
    },
  }),
  journal: openStored({
    path: () => "/admin/journal",
    heading: () => "Journal",
    ready: async (page, { accountName }) => {
      await expect(page.getByRole("link", { name: accountName }).first()).toBeVisible();
    },
  }),
  "Passalio team": openStored({
    path: () => "/admin/equipe",
    heading: () => "Équipe Passalio",
    ready: async (page) => {
      await expect(page.getByRole("heading", { name: "Invitations en attente" })).toBeVisible();
    },
  }),
  "join the Passalio team": openStored({
    isForInvitee: true,
    path: ({ invitationLink }) => invitationLink,
    heading: () => "Rejoindre l'équipe Passalio",
  }),
  "prospect companies": openStored({
    path: () => "/admin/entreprises",
    heading: () => "Entreprises",
    ready: firstOpenLink,
  }),
  "prospect company file": openStored({
    path: ({ companyPath }) => companyPath,
    heading: ({ companyName }) => companyName,
    ready: async (page) => {
      await expect(page.getByLabel("Ajouter une note")).toBeVisible();
    },
  }),
  "prospect contacts": openStored({
    path: () => "/admin/contacts",
    heading: () => "Contacts",
    ready: firstOpenLink,
  }),
  "prospect contact file": openStored({
    path: ({ contactPath }) => contactPath,
    heading: ({ contactName }) => contactName,
    ready: async (page) => {
      await expect(page.getByRole("heading", { name: "Historique" })).toBeVisible();
    },
  }),
  "prospection map": openStored({
    path: () => "/admin/prospection",
    heading: () => "Prospection",
    ready: async (page) => {
      await expect(page.getByRole("region", { name: "Entreprise sélectionnée" })).toBeVisible();
    },
  }),
  "my day": openStored({
    path: () => "/admin/journee",
    heading: () => "Ma journée",
    ready: async (page) => {
      await expect(page.getByRole("region", { name: "À faire maintenant" })).toBeVisible();
    },
  }),
  calls: openStored({
    path: () => "/admin/appels",
    heading: () => "Appels",
    ready: async (page) => {
      await expect(page.getByRole("region", { name: "Rappels du jour" })).toBeVisible();
    },
  }),
  "call session": openStored({
    path: ({ companyPath }) =>
      `/admin/appels/serie?entreprise=${companyPath.split("/").at(-1) ?? ""}`,
    heading: () => "Appel",
    ready: async (page) => {
      await expect(page.getByRole("form", { name: "Résultat" })).toBeVisible();
    },
  }),
  configuration: openStored({
    path: () => "/admin/configuration",
    heading: () => "Configuration",
    ready: async (page) => {
      await expect(page.getByRole("region", { name: "Connexion" })).toBeVisible();
    },
  }),
} as const satisfies Readonly<Record<string, OpenScreen>>;

export type AdminScreenName = keyof typeof ADMIN_SCREENS;
