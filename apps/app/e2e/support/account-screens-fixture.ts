import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Browser, type Page } from "@playwright/test";
import * as z from "zod";
import { signUpAndOnboardOwner, uniqueEmail } from "./accounts";
import { assignClientIp } from "./client-ip";
import { emailLinkSentBy } from "./email-links";
import { inviteFromTeamScreen, joinTeam, openTeamScreen } from "./team";
import { DESKTOP } from "./viewports";

const accountScreensFixture = z.object({
  ownerStatePath: z.string(),
  ownerFirstName: z.string(),
  resetLink: z.string(),
  pendingInvitationLink: z.string(),
  adminName: z.string(),
});

export type AccountScreensFixture = z.infer<typeof accountScreensFixture>;

const FIXTURE_FILE = "account-screens-fixture.json";

const OWNER_STATE_FILE = "account-screens-owner-state.json";

export const openForgotPassword = async (page: Page) => {
  await page.goto("/mot-de-passe-oublie");
  await expect(page.getByRole("heading", { name: "Mot de passe oublié" })).toBeVisible();
};

const requestResetLink = async (browser: Browser, email: string) => {
  const context = await browser.newContext({ viewport: DESKTOP });
  await assignClientIp(context);
  const page = await context.newPage();
  const link = await emailLinkSentBy("password_reset", async () => {
    await openForgotPassword(page);
    await page.getByLabel("Adresse email").fill(email);
    await page.getByRole("button", { name: "Recevoir le lien" }).click();
    await expect(page.getByText(/Si un compte existe pour cette adresse/)).toBeVisible();
  });
  await context.close();
  return link;
};

const prepareFixture = async (
  browser: Browser,
  directory: string,
): Promise<AccountScreensFixture> => {
  const ownerContext = await browser.newContext({ viewport: DESKTOP });
  await assignClientIp(ownerContext);
  const ownerPage = await ownerContext.newPage();
  const owner = await signUpAndOnboardOwner(ownerPage, { companyName: "Ramonage Accessible" });
  await openTeamScreen(ownerPage);
  const adminEmail = uniqueEmail("admin");
  const adminLink = await inviteFromTeamScreen(ownerPage, adminEmail, "Administrateur");
  const admin = await joinTeam(browser, adminLink, {
    viewport: DESKTOP,
    account: { firstName: "Alice", lastName: "Morel", email: adminEmail },
  });
  await admin.context.close();
  const pendingInvitationLink = await inviteFromTeamScreen(ownerPage, uniqueEmail("attente"));
  const ownerStatePath = join(directory, OWNER_STATE_FILE);
  await ownerContext.storageState({ path: ownerStatePath });
  await ownerContext.close();

  return {
    ownerStatePath,
    ownerFirstName: owner.firstName,
    resetLink: await requestResetLink(browser, adminEmail),
    pendingInvitationLink,
    adminName: admin.name,
  };
};

const readFixture = async (path: string) => {
  try {
    return accountScreensFixture.parse(JSON.parse(await readFile(path, "utf8")));
  } catch {
    return undefined;
  }
};

export const sharedAccountScreensFixture = async (browser: Browser, directory: string) => {
  const path = join(directory, FIXTURE_FILE);
  const existing = await readFixture(path);
  if (existing !== undefined) {
    return existing;
  }
  await mkdir(directory, { recursive: true });
  const prepared = await prepareFixture(browser, directory);
  await writeFile(path, JSON.stringify(prepared));
  return prepared;
};
