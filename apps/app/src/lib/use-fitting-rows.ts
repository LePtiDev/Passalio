import { useCallback, useState, useSyncExternalStore } from "react";
import { DESKTOP_QUERY, useMediaQuery } from "./use-media-query";

export type RowHeights = { readonly mobile: number; readonly desktop: number };

const MIN_ROWS = 5;

const MAX_ROWS = 50;

const MOBILE_RESERVED = 84 + 65 + 16;

const DESKTOP_RESERVED = 40 + 49 + 12;

const subscribe = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};

const readHeight = () => window.innerHeight;

const watchTop = (node: HTMLElement, onTop: (top: number) => void) => {
  const measure = () => onTop(Math.round(node.getBoundingClientRect().top + window.scrollY));
  measure();
  const observer = new ResizeObserver(measure);
  for (let parent = node.parentElement; parent !== null; parent = parent.parentElement) {
    observer.observe(parent);
  }
  return () => observer.disconnect();
};

export const rowsThatFit = (available: number, rowHeight: number) =>
  Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.floor(available / rowHeight)));

export const useFittingRows = (heights: RowHeights) => {
  const [top, setTop] = useState<number | null>(null);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const viewport = useSyncExternalStore(subscribe, readHeight, () => 900);
  const measureList = useCallback(
    (node: HTMLElement | null) => (node === null ? undefined : watchTop(node, setTop)),
    [],
  );
  const reserved = isDesktop ? DESKTOP_RESERVED : MOBILE_RESERVED;
  const rowHeight = isDesktop ? heights.desktop : heights.mobile;
  const pageSize = top === null ? null : rowsThatFit(viewport - top - reserved, rowHeight);
  return { measureList, pageSize };
};
