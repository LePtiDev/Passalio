import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type ViewportSize,
} from "@playwright/test";
import { API_LOG_PATH } from "../../playwright.config";
import { newAccount, signUp, type NewAccount } from "./accounts";
import * as z from "zod";
import { assignClientIp } from "./client-ip";
import { inSequence } from "./sequence";
import { secretOfTotpUri, totpCode } from "./totp";

export type PlatformRole = "superadmin" | "admin" | "sales";

const run = promisify(execFile);

const API_DIR = resolve("../api");
const E2E_STATE_DIR = resolve(dirname(API_LOG_PATH), "state");

const sqlText = (value: string) => `'${value.replaceAll("'", "''")}'`;

export const executeLocalSql = async (sql: string) => {
  await run(
    "npx",
    ["wrangler", "d1", "execute", "DB", "--local", "--persist-to", E2E_STATE_DIR, "--command", sql],
    { cwd: API_DIR, env: { ...process.env, CI: "true" } },
  );
};

export const grantPlatformRole = (email: string, role: PlatformRole) =>
  executeLocalSql(
    `UPDATE users SET role = ${sqlText(role)}, updated_at = ${Date.now()} WHERE email = ${sqlText(email.toLowerCase())}`,
  );

export const ageTwoFactorVerification = (email: string, hours: number) =>
  executeLocalSql(
    `UPDATE sessions SET two_factor_verified_at = ${Date.now() - hours * 3_600_000} WHERE user_id = (SELECT id FROM users WHERE email = ${sqlText(email.toLowerCase())})`,
  );

const TOTP_SLOTS = Array.from({ length: 6 }, (_, index) => index);

const KEY_GROUP = /.{1,4}/g;

const enableResponse = z.object({ totpURI: z.string() });

export const fillTotpCode = async (page: Page, label: string, secret: string) => {
  const input = page.getByLabel(label);
  await input.focus();
  await inSequence(TOTP_SLOTS, () => input.press("Backspace"));
  await expect(input).toHaveValue("");
  await input.pressSequentially(await totpCode(secret));
};

export type TwoFactorEnrollment = {
  readonly secret: string;
  readonly backupCodes: readonly string[];
};

export const startTwoFactorSetup = async (page: Page, password: string) => {
  await expect(page).toHaveURL(/\/admin\/securite/);
  await expect(
    page.getByRole("heading", { name: "Activez la double authentification" }),
  ).toBeVisible();
  await page.getByLabel("Confirmez votre mot de passe").fill(password);
  const enabled = page.waitForResponse(
    (response) => response.url().endsWith("/api/auth/two-factor/enable") && response.ok(),
  );
  await page.getByRole("button", { name: "Continuer" }).click();
  const { totpURI } = enableResponse.parse(await (await enabled).json());
  const secret = secretOfTotpUri(totpURI);
  expect(secret).toMatch(/^[A-Z2-7]{16,}$/);
  await expect(page.getByText("1. Scannez ce QR code")).toBeVisible();
  await expect(
    page.getByText("QR code à scanner avec votre application d'authentification"),
  ).toBeAttached();
  await expect(page.getByText(secret.match(KEY_GROUP)?.join(" ") ?? secret)).toBeVisible();
  return secret;
};

export const enrollTwoFactor = async (
  page: Page,
  password: string,
): Promise<TwoFactorEnrollment> => {
  const secret = await startTwoFactorSetup(page, password);
  await fillTotpCode(page, "2. Saisissez le code à 6 chiffres", secret);
  await page.getByRole("button", { name: "Activer" }).click();
  const codes = page.getByRole("list", { name: "Codes de secours" }).getByRole("listitem");
  await expect(codes).toHaveCount(10);
  const backupCodes = await codes.allInnerTexts();
  await page.getByRole("button", { name: "J'ai noté mes codes" }).click();
  await expect(page.getByText("Double authentification activée.")).toBeVisible();
  return { secret, backupCodes };
};

export type PlatformMember = NewAccount & TwoFactorEnrollment & { readonly role: PlatformRole };

export const signUpPlatformMember = async (
  page: Page,
  role: PlatformRole,
  overrides: Partial<NewAccount> = {},
): Promise<PlatformMember> => {
  const account = await signUp(page, newAccount(overrides));
  await expect(page).toHaveURL(/\/configuration\/entreprise/);
  await grantPlatformRole(account.email, role);
  await page.goto("/admin");
  const enrollment = await enrollTwoFactor(page, account.password);
  return { ...account, ...enrollment, role };
};

export type AdminSession = {
  readonly context: BrowserContext;
  readonly page: Page;
  readonly member: PlatformMember;
};

export const openAdminSession = async (
  browser: Browser,
  viewport: ViewportSize,
  role: PlatformRole,
  overrides: Partial<NewAccount> = {},
): Promise<AdminSession> => {
  const context = await browser.newContext({ viewport });
  await assignClientIp(context);
  const page = await context.newPage();
  const member = await signUpPlatformMember(page, role, overrides);
  return { context, page, member };
};

export const signInWithCode = async (page: Page, member: PlatformMember) => {
  await page.goto("/connexion");
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
  await page.getByLabel("Adresse email").fill(member.email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(member.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/connexion\/code/);
  await expect(page.getByRole("heading", { name: "Code de vérification" })).toBeVisible();
};
