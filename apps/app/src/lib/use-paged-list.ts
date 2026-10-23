import { useCursorPages } from "./use-cursor-pages";
import { useFittingRows, type RowHeights } from "./use-fitting-rows";

export const usePagedList = (scopeKey: string, heights: RowHeights) => {
  const { measureList, pageSize } = useFittingRows(heights);
  const pages = useCursorPages(`${scopeKey}:${pageSize ?? 0}`);
  return { measureList, pageSize, ...pages };
};

export type PagedList = ReturnType<typeof usePagedList>;
