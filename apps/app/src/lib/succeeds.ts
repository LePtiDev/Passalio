export const succeeds = (promise: Promise<unknown>): Promise<boolean> =>
  promise.then(
    () => true,
    () => false,
  );
