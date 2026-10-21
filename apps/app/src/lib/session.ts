import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth-client";

export const SIGN_IN_PATH = "/connexion";

export const loadSession = async () => {
  const { data } = await authClient.getSession();
  return data;
};

export const requireSession = async (returnTo: string) => {
  const session = await loadSession();
  if (session === null) {
    throw redirect({ to: SIGN_IN_PATH, search: { retour: returnTo } });
  }
  return session;
};

export const ensureActiveOrganization = async (returnTo: string) => {
  const session = await requireSession(returnTo);
  if (session.session.activeOrganizationId) {
    return session;
  }
  const { data: organizations } = await authClient.organization.list();
  const first = organizations?.[0];
  if (first === undefined) {
    throw redirect({ to: "/entreprise/nouvelle" });
  }
  await authClient.organization.setActive({ organizationId: first.id });
  return session;
};
