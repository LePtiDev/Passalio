import * as z from "zod";

const offlineSession = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  organizationId: z.string(),
});

export type OfflineSession = z.infer<typeof offlineSession>;

const STORAGE_KEY = "passalio.offline-session";

const parseJson = (text: string | null): unknown => {
  try {
    return text === null ? undefined : JSON.parse(text);
  } catch {
    return undefined;
  }
};

export const rememberOfflineSession = (session: OfflineSession) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const readOfflineSession = (): OfflineSession | undefined => {
  const parsed = offlineSession.safeParse(parseJson(localStorage.getItem(STORAGE_KEY)));
  return parsed.success ? parsed.data : undefined;
};

export const forgetOfflineSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};
