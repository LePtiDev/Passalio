import { useCallback, useState } from "react";
import { type CursorStack, FIRST_PAGE, popCursor, pushCursor } from "./cursor-stack";

type KeyedStack = { readonly key: string; readonly cursors: CursorStack };

export const useCursorPages = (resetKey: string) => {
  const [state, setState] = useState<KeyedStack>({ key: resetKey, cursors: FIRST_PAGE });
  const cursors = state.key === resetKey ? state.cursors : FIRST_PAGE;
  const update = useCallback(
    (change: (stack: CursorStack) => CursorStack) =>
      setState((previous) => ({
        key: resetKey,
        cursors: change(previous.key === resetKey ? previous.cursors : FIRST_PAGE),
      })),
    [resetKey],
  );
  const goNext = useCallback(
    (nextCursor: string) => update((stack) => pushCursor(stack, nextCursor)),
    [update],
  );
  const goPrevious = useCallback(() => update(popCursor), [update]);
  return { page: cursors.length - 1, cursor: cursors.at(-1) ?? null, goNext, goPrevious };
};
