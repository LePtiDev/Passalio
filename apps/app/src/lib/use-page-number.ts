import { useCallback, useState } from "react";

export const usePageNumber = (resetKey: string) => {
  const [state, setState] = useState({ key: resetKey, page: 0 });
  const page = state.key === resetKey ? state.page : 0;
  const goNext = useCallback(
    () =>
      setState((previous) => ({
        key: resetKey,
        page: (previous.key === resetKey ? previous.page : 0) + 1,
      })),
    [resetKey],
  );
  const goPrevious = useCallback(
    () =>
      setState((previous) => ({
        key: resetKey,
        page: Math.max(0, (previous.key === resetKey ? previous.page : 0) - 1),
      })),
    [resetKey],
  );
  return { page, goNext, goPrevious };
};
