import { isRedirect } from "@tanstack/react-router";

const REVALIDATE_AFTER_MS = 60 * 1000;

type Remembered<T> = { readonly value: T; readonly checkedAt: number };

export type RememberedCheck<T> = {
  readonly read: (returnTo: string) => Promise<T>;
  readonly revalidateIfStale: (returnTo: string) => Promise<void>;
  readonly forget: () => void;
};

const allChecks = new Set<RememberedCheck<unknown>>();

export const createRememberedCheck = <T>(
  check: (returnTo: string) => Promise<T>,
): RememberedCheck<T> => {
  let remembered: Remembered<T> | undefined;
  const run = async (returnTo: string) => {
    try {
      const value = await check(returnTo);
      remembered = { value, checkedAt: Date.now() };
      return value;
    } catch (thrown) {
      if (isRedirect(thrown)) {
        remembered = undefined;
      }
      throw thrown;
    }
  };
  const isStale = (known: Remembered<T>) => Date.now() - known.checkedAt >= REVALIDATE_AFTER_MS;
  const rememberedCheck: RememberedCheck<T> = {
    read: async (returnTo) => (remembered === undefined ? run(returnTo) : remembered.value),
    revalidateIfStale: async (returnTo) => {
      if (remembered !== undefined && isStale(remembered)) {
        await run(returnTo);
      }
    },
    forget: () => {
      remembered = undefined;
    },
  };
  allChecks.add(rememberedCheck);
  return rememberedCheck;
};

export const forgetRememberedChecks = () => {
  for (const check of allChecks) {
    check.forget();
  }
};
