import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  forgetOfflineSession,
  readOfflineSession,
  rememberOfflineSession,
  type OfflineSession,
} from "./offline-session";
import { loadSignedInSession } from "./session";

type ServerAnswer = "unreachable" | "signed_in" | "signed_out";

const server = vi.hoisted(() => {
  const state: { answer: ServerAnswer } = { answer: "signed_in" };
  const getSession = vi.fn<() => Promise<unknown>>(async () => {
    if (state.answer === "unreachable") {
      throw new TypeError("Failed to fetch");
    }
    return state.answer === "signed_out"
      ? { data: null, error: null }
      : {
          data: {
            user: { id: "user-1", name: "Élodie", email: "elodie@example.fr", role: null },
            session: { activeOrganizationId: "organization-a" },
          },
          error: null,
        };
  });
  return { state, getSession };
});

vi.mock("./auth-client", () => ({
  authClient: {
    getSession: server.getSession,
    organization: {
      list: vi.fn<() => Promise<unknown>>(async () => ({ data: [] })),
      setActive: vi.fn<() => Promise<unknown>>(async () => ({})),
    },
  },
}));

const remembered: OfflineSession = {
  userId: "user-1",
  name: "Élodie",
  email: "elodie@example.fr",
  organizationId: "organization-a",
};

const setOnline = (isOnline: boolean) => {
  vi.stubGlobal("navigator", { onLine: isOnline });
};

beforeAll(() => {
  GlobalRegistrator.register();
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(() => {
  forgetOfflineSession();
  server.getSession.mockClear();
  server.state.answer = "signed_in";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("offline start", () => {
  it("opens the app with the remembered session when the phone has no network", async () => {
    rememberOfflineSession(remembered);
    setOnline(false);
    expect(await loadSignedInSession("/clients")).toEqual(remembered);
    expect(server.getSession).not.toHaveBeenCalled();
  });

  it("opens the app with the remembered session when the server cannot be reached", async () => {
    rememberOfflineSession(remembered);
    setOnline(true);
    server.state.answer = "unreachable";
    expect(await loadSignedInSession("/clients")).toEqual(remembered);
  });

  it("remembers the session once the server confirmed it, for the next offline start", async () => {
    setOnline(true);
    expect(await loadSignedInSession("/clients")).toEqual(remembered);
    expect(readOfflineSession()).toEqual(remembered);
    setOnline(false);
    expect(await loadSignedInSession("/clients")).toEqual(remembered);
  });

  it("sends to the sign-in page when offline with no remembered session", async () => {
    setOnline(false);
    await expect(loadSignedInSession("/clients")).rejects.toMatchObject({
      options: { to: "/connexion", search: { retour: "/clients" } },
    });
  });

  it("does not reopen the app offline after sign-out forgot the session", async () => {
    rememberOfflineSession(remembered);
    forgetOfflineSession();
    setOnline(false);
    await expect(loadSignedInSession("/clients")).rejects.toMatchObject({
      options: { to: "/connexion" },
    });
  });

  it("sends to the sign-in page when the server says the session is over, even if one was remembered", async () => {
    rememberOfflineSession(remembered);
    setOnline(true);
    server.state.answer = "signed_out";
    await expect(loadSignedInSession("/clients")).rejects.toMatchObject({
      options: { to: "/connexion" },
    });
  });
});
