import { isRedirect } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "./auth-client";
import { loadOrganizationState, requireSignedOut } from "./session";

vi.mock("./auth-client", () => ({
  authClient: {
    getSession: vi.fn<() => Promise<unknown>>(),
    organization: {
      list: vi.fn<() => Promise<unknown>>(),
      setActive: vi.fn<() => Promise<unknown>>(),
    },
  },
}));

const signedInAs = (role: string | null, activeOrganizationId: string | null = null) => {
  const data = {
    user: { id: "user-1", name: "Quentin", email: "quentin@example.fr", role },
    session: { id: "session-1", activeOrganizationId },
  };
  vi.mocked(authClient.getSession).mockResolvedValue(Object.assign({ data, error: null }));
};

const redirectTarget = async (guard: Promise<unknown>) => {
  const outcome = await guard.then(
    () => null,
    (thrown: unknown) => thrown,
  );
  return isRedirect(outcome) ? outcome.options.to : null;
};

beforeEach(() => {
  vi.mocked(authClient.organization.list).mockResolvedValue(
    Object.assign({ data: [], error: null }),
  );
});

describe("requireSignedOut", () => {
  it("sends a signed-in person back to where they were going", async () => {
    signedInAs("user");
    expect(await redirectTarget(requireSignedOut("/clients"))).toBe("/clients");
    expect(await redirectTarget(requireSignedOut())).toBe("/");
  });

  it("lets a signed-out person through", async () => {
    vi.mocked(authClient.getSession).mockResolvedValue(Object.assign({ data: null, error: null }));
    expect(await redirectTarget(requireSignedOut())).toBeNull();
  });
});

describe("loadOrganizationState", () => {
  it("sends a platform admin to the admin space instead of the company setup", async () => {
    signedInAs("superadmin");
    expect(await redirectTarget(loadOrganizationState("/configuration/entreprise"))).toBe("/admin");
  });

  it("lets a craftsman without a company set one up", async () => {
    signedInAs("user");
    expect(await redirectTarget(loadOrganizationState("/configuration/entreprise"))).toBeNull();
  });
});
