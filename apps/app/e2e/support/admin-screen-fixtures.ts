import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { expect, type Browser } from "@playwright/test";
import * as z from "zod";
import { API_LOG_PATH } from "../../playwright.config";
import { fillSignUpForm, newAccount, uniqueEmail } from "./accounts";
import { assignClientIp } from "./client-ip";
import { onboardCustomerInNewContext } from "./customer-account";
import { emailLinkSentBy } from "./email-links";
import { openAdminSession } from "./platform-admin";
import { addProspectContact, createProspectCompany, uniqueToken } from "./prospects";
import { DESKTOP } from "./viewports";

const STATE_DIR = resolve(dirname(API_LOG_PATH), "state");

export const ADMIN_STATE_FILE = resolve(STATE_DIR, "admin-screens-admin.json");
export const INVITEE_STATE_FILE = resolve(STATE_DIR, "admin-screens-invitee.json");
const FIXTURES_FILE = resolve(STATE_DIR, "admin-screens-fixtures.json");

const adminScreenFixtures = z.object({
  accountName: z.string(),
  accountPath: z.string(),
  companyName: z.string(),
  companyPath: z.string(),
  contactName: z.string(),
  contactPath: z.string(),
  invitationLink: z.string(),
});

export type AdminScreenFixtures = z.infer<typeof adminScreenFixtures>;

const readSavedFixtures = async () => {
  try {
    return adminScreenFixtures.parse(JSON.parse(await readFile(FIXTURES_FILE, "utf8")));
  } catch {
    return null;
  }
};

const prepareFixtures = async (browser: Browser): Promise<AdminScreenFixtures> => {
  const token = uniqueToken();
  const accountName = `Ramonage Accessible ${token}`;
  await onboardCustomerInNewContext(browser, accountName, {
    firstName: "Louise",
    lastName: "Martin",
  });

  const admin = await openAdminSession(browser, DESKTOP, "superadmin");
  await admin.page.goto(`/admin/comptes?recherche=${token}`);
  await admin.page.getByRole("link", { name: `Ouvrir ${accountName}` }).click();
  await expect(admin.page).toHaveURL(/\/admin\/comptes\/[^/?]+$/);
  const accountPath = new URL(admin.page.url()).pathname;

  const companyName = `Ramonage Prospect ${token}`;
  const companyId = await createProspectCompany(admin.page, {
    name: companyName,
    department: "94",
    city: "Créteil",
    latitude: 48.79,
    longitude: 2.45,
  });
  const contactLastName = `Accessible${token}`;
  const contactId = await addProspectContact(admin.page, companyId, {
    firstName: "Claire",
    lastName: contactLastName,
    isMain: true,
    isLeader: true,
  });

  const inviteeEmail = uniqueEmail("equipe");
  const invitationLink = await emailLinkSentBy("team_invitation", async () => {
    const response = await admin.page.request.post("/api/admin/team/invitations", {
      data: { email: inviteeEmail, role: "sales" },
    });
    expect(response.ok()).toBe(true);
  });
  const invitee = await browser.newContext({ viewport: DESKTOP });
  await assignClientIp(invitee);
  const inviteePage = await invitee.newPage();
  await inviteePage.goto(invitationLink);
  await expect(inviteePage.getByRole("link", { name: "Créer un compte" })).toBeVisible();
  await inviteePage.getByRole("link", { name: "Créer un compte" }).click();
  await fillSignUpForm(inviteePage, newAccount({ email: inviteeEmail }));
  await expect(
    inviteePage.getByRole("heading", { name: "Rejoindre l'équipe Passalio" }),
  ).toBeVisible();

  await admin.context.storageState({ path: ADMIN_STATE_FILE });
  await invitee.storageState({ path: INVITEE_STATE_FILE });
  await admin.context.close();
  await invitee.close();

  const fixtures: AdminScreenFixtures = {
    accountName,
    accountPath,
    companyName,
    companyPath: `/admin/entreprises/${companyId}`,
    contactName: `Claire ${contactLastName}`,
    contactPath: `/admin/contacts/${contactId}`,
    invitationLink,
  };
  await writeFile(FIXTURES_FILE, JSON.stringify(fixtures));
  return fixtures;
};

export const loadAdminScreenFixtures = async (browser: Browser) =>
  (await readSavedFixtures()) ?? prepareFixtures(browser);
