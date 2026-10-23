import { expect, type Page } from "@playwright/test";
import { type AccountScreensFixture, openForgotPassword } from "./account-screens-fixture";
import { uniqueEmail } from "./accounts";
import { openPendingInvitations, openTeamScreen } from "./team";

export type AccountScreen = {
  readonly name: string;
  readonly isSignedIn: boolean;
  readonly open: (page: Page, fixture: AccountScreensFixture) => Promise<void>;
};

const openSignIn = async (page: Page) => {
  await page.goto("/connexion");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Se connecter" })).toBeEnabled();
};

const openSignUp = async (page: Page) => {
  await page.goto("/inscription");
  await expect(page.getByRole("heading", { name: "Créer votre compte" })).toBeVisible();
};

const openMemberActions = async (page: Page, adminName: string) => {
  await openTeamScreen(page);
  await page.getByRole("button", { name: `Actions pour ${adminName}` }).click();
  await expect(page.getByRole("menuitem", { name: "Transférer la propriété" })).toBeVisible();
};

export const ACCOUNT_SCREENS = {
  signIn: { name: "sign-in screen", isSignedIn: false, open: openSignIn },
  refusedSignIn: {
    name: "sign-in screen with a refused password",
    isSignedIn: false,
    open: async (page) => {
      await openSignIn(page);
      await page.getByLabel("Adresse email").fill(uniqueEmail("inconnu"));
      await page.getByLabel("Mot de passe", { exact: true }).fill("pas-le-bon-mot-de-passe");
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page.getByText("Adresse email ou mot de passe incorrect.")).toBeVisible();
    },
  },
  signUp: { name: "sign-up screen", isSignedIn: false, open: openSignUp },
  signUpErrors: {
    name: "sign-up screen with its errors",
    isSignedIn: false,
    open: async (page) => {
      await openSignUp(page);
      await page.getByRole("button", { name: "Créer mon compte" }).click();
      await expect(page.getByText("Acceptez les conditions pour continuer.")).toBeVisible();
    },
  },
  forgotPassword: { name: "forgot password screen", isSignedIn: false, open: openForgotPassword },
  forgotPasswordSent: {
    name: "forgot password confirmation",
    isSignedIn: false,
    open: async (page) => {
      await openForgotPassword(page);
      await page.getByLabel("Adresse email").fill(uniqueEmail("inconnu"));
      await page.getByRole("button", { name: "Recevoir le lien" }).click();
      await expect(page.getByText(/Si un compte existe pour cette adresse/)).toBeVisible();
    },
  },
  newPassword: {
    name: "new password screen",
    isSignedIn: false,
    open: async (page, { resetLink }) => {
      await page.goto(resetLink);
      await expect(page.getByRole("heading", { name: "Nouveau mot de passe" })).toBeVisible();
    },
  },
  expiredResetLink: {
    name: "expired reset link screen",
    isSignedIn: false,
    open: async (page) => {
      await page.goto("/mot-de-passe/nouveau?error=INVALID_TOKEN");
      await expect(page.getByRole("heading", { name: "Lien expiré" })).toBeVisible();
    },
  },
  invitation: {
    name: "invitation screen",
    isSignedIn: true,
    open: async (page, { pendingInvitationLink }) => {
      await page.goto(pendingInvitationLink);
      await expect(page.getByRole("heading", { name: "Rejoindre l'équipe" })).toBeVisible();
    },
  },
  home: {
    name: "home screen",
    isSignedIn: true,
    open: async (page, { ownerFirstName }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: `Bonjour ${ownerFirstName}` })).toBeVisible();
    },
  },
  settings: {
    name: "settings screen",
    isSignedIn: true,
    open: async (page) => {
      await page.goto("/reglages");
      await expect(page.getByRole("heading", { name: "Réglages" })).toBeVisible();
    },
  },
  teamMembers: {
    name: "team members tab",
    isSignedIn: true,
    open: async (page, { adminName }) => {
      await openTeamScreen(page);
      await expect(page.getByRole("button", { name: `Rôle de ${adminName}` })).toBeVisible();
    },
  },
  teamPending: {
    name: "team pending invitations tab",
    isSignedIn: true,
    open: async (page) => {
      await openTeamScreen(page);
      await openPendingInvitations(page);
      await expect(page.getByRole("button", { name: "Renvoyer" })).toBeVisible();
    },
  },
  inviteDialog: {
    name: "invite dialog",
    isSignedIn: true,
    open: async (page) => {
      await openTeamScreen(page);
      await page.getByRole("button", { name: "Inviter une personne" }).first().click();
      await expect(page.getByRole("dialog", { name: "Inviter une personne" })).toBeVisible();
    },
  },
  roleMenu: {
    name: "role menu",
    isSignedIn: true,
    open: async (page, { adminName }) => {
      await openTeamScreen(page);
      await page.getByRole("button", { name: `Rôle de ${adminName}` }).click();
      await expect(page.getByRole("menuitemradio", { name: "Secrétariat" })).toBeVisible();
    },
  },
  memberActions: {
    name: "member actions menu",
    isSignedIn: true,
    open: async (page, { adminName }) => openMemberActions(page, adminName),
  },
  removeConfirmation: {
    name: "remove member confirmation",
    isSignedIn: true,
    open: async (page, { adminName }) => {
      await openMemberActions(page, adminName);
      await page.getByRole("menuitem", { name: "Retirer de l'équipe" }).click();
      await expect(
        page.getByRole("alertdialog", { name: `Retirer ${adminName} de l'équipe ?` }),
      ).toBeVisible();
    },
  },
  transferConfirmation: {
    name: "transfer ownership confirmation",
    isSignedIn: true,
    open: async (page, { adminName }) => {
      await openMemberActions(page, adminName);
      await page.getByRole("menuitem", { name: "Transférer la propriété" }).click();
      await expect(
        page.getByRole("alertdialog", { name: `Transférer la propriété à ${adminName} ?` }),
      ).toBeVisible();
    },
  },
} satisfies Record<string, AccountScreen>;

export type AccountScreenKey = keyof typeof ACCOUNT_SCREENS;
