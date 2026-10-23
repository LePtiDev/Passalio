import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { Dexie } from "dexie";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createCustomer } from "@/contexts/customers/customer-store";
import { deleteLocalDatabases, localDatabaseOf } from "./db/local-database";
import { readOfflineSession, rememberOfflineSession } from "./offline-session";
import { useSignOut } from "./use-sign-out";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn<(options: unknown) => Promise<void>>(async () => undefined),
  clearQueries: vi.fn<() => void>(),
  signOut: vi.fn<() => Promise<unknown>>(async () => ({})),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => mocks.navigate,
}));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => ({ clear: mocks.clearQueries }),
}));

vi.mock("./auth-client", () => ({
  authClient: { signOut: mocks.signOut },
}));

const actor = { userId: "user-1", organizationId: "organization-a" };

let signOut: (() => Promise<void>) | undefined;

const SignOutProbe = ({
  onSignOut,
}: {
  readonly onSignOut: (signOut: () => Promise<void>) => void;
}) => {
  onSignOut(useSignOut());
  return null;
};

const rememberSignOut = (rendered: () => Promise<void>) => {
  signOut = rendered;
};

const passalioDatabaseNames = async () =>
  (await Dexie.getDatabaseNames()).filter((name) => name.startsWith("passalio-"));

let root: Root;

beforeAll(() => {
  GlobalRegistrator.register();
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  Dexie.dependencies.indexedDB = indexedDB;
  Dexie.dependencies.IDBKeyRange = IDBKeyRange;
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(async () => {
  root = createRoot(document.createElement("div"));
  await act(async () => {
    root.render(<SignOutProbe onSignOut={rememberSignOut} />);
  });
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  await deleteLocalDatabases();
});

describe("sign-out", () => {
  it("wipes every local database of the person, including changes not yet sent", async () => {
    const first = localDatabaseOf("organization-a");
    await createCustomer(first, actor, { customer: { kind: "individual", lastName: "Lefèvre" } });
    const second = localDatabaseOf("organization-b");
    await createCustomer(
      second,
      { ...actor, organizationId: "organization-b" },
      {
        customer: { kind: "individual", lastName: "Martin" },
      },
    );
    expect(await passalioDatabaseNames()).toHaveLength(2);
    await act(async () => {
      await signOut?.();
    });
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(await passalioDatabaseNames()).toEqual([]);
    const reopened = localDatabaseOf("organization-a");
    expect(await reopened.customers.count()).toBe(0);
    expect(await reopened.outbox.count()).toBe(0);
  });

  it("forgets the remembered session and returns to the sign-in page", async () => {
    rememberOfflineSession({
      userId: "user-1",
      name: "Élodie",
      email: "elodie@example.fr",
      organizationId: "organization-a",
    });
    await act(async () => {
      await signOut?.();
    });
    expect(readOfflineSession()).toBeUndefined();
    expect(mocks.clearQueries).toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/connexion" }));
  });

  it("keeps databases that do not belong to Passalio", async () => {
    const other = new Dexie("autre-application");
    other.version(1).stores({ items: "id" });
    await other.open();
    other.close();
    await deleteLocalDatabases();
    expect(await Dexie.getDatabaseNames()).toContain("autre-application");
    await Dexie.delete("autre-application");
  });
});
