export type CursorStack = readonly (string | null)[];

export const FIRST_PAGE: CursorStack = [null];

export const pushCursor = (stack: CursorStack, cursor: string): CursorStack => [...stack, cursor];

export const popCursor = (stack: CursorStack): CursorStack =>
  stack.length > 1 ? stack.slice(0, -1) : FIRST_PAGE;
