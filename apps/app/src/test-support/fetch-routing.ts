const offlineFetch: typeof fetch = async () => {
  throw new TypeError("no fake api installed");
};

export const routeCapturedFetchToFakeApi = () => {
  const currentFetch: typeof fetch = (input, init) => {
    const stubbed = globalThis.fetch;
    return (stubbed === currentFetch ? offlineFetch : stubbed)(input, init);
  };
  globalThis.fetch = currentFetch;
};
